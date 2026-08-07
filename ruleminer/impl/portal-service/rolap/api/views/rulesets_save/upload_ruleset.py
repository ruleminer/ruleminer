import json
from typing import Union

from decision_rules.serialization.utils import JSONSerializer
from decision_rules.ruleset_factories import _factories
from decision_rules.survival.ruleset import SurvivalRuleSet
from decision_rules.core.ruleset import AbstractRuleSet
from numpy import inf
from numpy import nan
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rolap.api.exceptions import InvalidRequestException
from rolap.api.exceptions import InvalidRuleFormatException
from rolap.api.exceptions import NoFileProvidedException
from rolap.api.exceptions import RulesetJSONDeserializationException
from rolap.api.exceptions import UnsupportedFileTypeException
from rolap.api.exceptions import UploadRulesetFactoriesException
from rolap.api.models import Dataset
from rolap.api.models import Ruleset
from rolap.api.models.algorithms import VotingMeasures
from rolap.api.models.algorithms import RuleSetImportAlgorithm
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.projects import Project
from rolap.api.models.rulesets.worker_rulesets import SaveRulesetWorkerRequest
from rolap.api.permissions import IsRolapOperator
from rolap.api.permissions import IsRolapUser
from rolap.api.serializers.algorithms import ManageVotingMeasuresSerializer
from rolap.api.serializers.algorithms import RuleSetImportAlgorithmSerializer
from rolap.api.serializers.rulesets.creation import UploadRulesetSerializer
from rolap.api.serializers.rulesets.rulesets import PredictionConfig
from rolap.api.serializers.tasks import TaskResponseSerializer
from rolap.api.utils.constants import RULESET_TYPE_MAPPING
from rolap.api.utils.statistics import calculate_ruleset_indicators
from rolap.api.views.base import DatasetBaseView
from rolap.api.views.base import ProjectBaseView
from rolap.api.views.rulesets_save.mixins import CreateRulesetMixin


from decision_rules.core.exceptions import (
    RulesetFactoriesException as DRRulesetFactoriesException,
    RuleConclusionFormatException as DRRuleConclusionFormatException,
    RuleConclusionFloatConversionException as DRRuleConclusionFloatConversionException,
    DecisionAttributeMismatchException as DRDecisionAttributeMismatchException,
    InvalidMeasureNameException as DRInvalidMeasureNameException,
    InvalidSurvivalTimeAttributeException as DRInvalidSurvivalTimeAttributeException,
    InvalidConditionFormatException as DRInvalidConditionFormatException,
    AttributeNotFoundException as DRAttributeNotFoundException,
    InvalidNumericValueException as DRInvalidNumericValueException,
    InvalidValueFormatException as DRInvalidValueFormatException,
    MissingIfKeywordException as DRMissingIfKeywordException,
    LordParsingException as DRLordParsingException,
    MLRulesParsingException as DRMLRulesParsingException,

)


class VotingMeasuresListView(APIView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets_save']

        def get_response_serializer(self, path, method):
            return ManageVotingMeasuresSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="voting_measures_list")
    permission_classes = [IsRolapUser | IsRolapOperator]

    def get(self, *args, **kargs) -> Response:
        """HTTP GET method to retrieve voting measures.

        Returns:
            Response: A Response object containing the voting measures data in JSON format.
        """
        measures = VotingMeasures.objects.all()
        if not measures:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ManageVotingMeasuresSerializer(measures, many=True)
        return Response(serializer.data)


class RulesetImportAlgorithmListView(ProjectBaseView, ListAPIView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['import_algorithms']

        def get_response_serializer(self, path, method):
            return RuleSetImportAlgorithmSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="import_algorithm_list")
    lookup_url_kwarg = "project_id"
    permission_classes = [IsRolapUser | IsRolapOperator]

    def get(self, request: Request, *args, **kwargs) -> Response:
        """Retrieve available import algorithms for a given project.

        Args:
            project_id (int): The ID of the project to determine the problem type.

        Returns:
            Response: JSON list of import algorithms supporting the project's problem type.
        """
        project = self.get_object()

        algorithms = RuleSetImportAlgorithm.objects.filter(
            supported_problem_types__contains=[project.type_of_problem]
        )

        if not algorithms.exists():
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = RuleSetImportAlgorithmSerializer(algorithms, many=True)
        return Response(serializer.data)


class UploadRulesetView(CreateRulesetMixin, DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets_save']

        def get_request_serializer(self, path, method):
            return UploadRulesetSerializer()

        def get_response_serializer(self, path, method):
            return TaskResponseSerializer()

    schema = _CustomSchema(operation_id_base="upload_ruleset")
    serializer_class = UploadRulesetSerializer

    def post(self, request: Request, *args, **kwargs):
        try:
            json_data = json.loads(request.data['data'])
        except Exception as error:
            raise InvalidRequestException(str(error))

        serializer = UploadRulesetSerializer(data=json_data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        dataset: Dataset = self.get_object()
        decision_attribute_name = dataset.class_attribute
        columns_names = list(DatasetAttributes.objects.filter(
            dataset_id=dataset.pk, role__in=[
                DatasetAttributes.DataAttributeRoles.ATTRIBUTE,
                DatasetAttributes.DataAttributeRoles.SURVIVAL_TIME
            ]
        ).order_by("pk").values_list("name", flat=True))

        if dataset.class_distribution:
            labels_values = list(dataset.class_distribution.keys())
            y_counts = list(dataset.class_distribution.values())
        else:
            labels_values = []
            y_counts = []
        self.can_create_ruleset(dataset)
        self.validate_name(dataset, data["name"])
        algorithm_params = {}

        ruleset = self.handle_file_upload(request, dataset)

        external_algo = data.get("external_algorithm_name", "JSON")
        if external_algo != "JSON":
            try:
                factory_class = self._select_factory(
                    external_algo, dataset.project.type_of_problem)

                if dataset.project.type_of_problem == Project.SURVIVAL:
                    survival_time_attribute = next(
                        (attr.name for attr in dataset.attributes.all()
                         if attr.role == DatasetAttributes.DataAttributeRoles.SURVIVAL_TIME),
                        None
                    )
                    if not survival_time_attribute:
                        raise InvalidRequestException(
                            "Survival time attribute not found in dataset attributes.")

                    algorithm_params = {
                        "survival_time_attr": survival_time_attribute}
                    ruleset: SurvivalRuleSet = factory_class._build_ruleset(
                        model=ruleset,
                        y_counts=y_counts,
                        decision_attribute_name=decision_attribute_name,
                        labels_values=labels_values,
                        columns_names=columns_names,
                        survival_time_attr=survival_time_attribute
                    )

                    self._sanitize_rules_conclusions(ruleset)
                else:
                    ruleset: AbstractRuleSet = factory_class._build_ruleset(
                        model=ruleset,
                        y_counts=y_counts,
                        decision_attribute_name=decision_attribute_name,
                        labels_values=labels_values,
                        columns_names=columns_names
                    )
                if dataset.project.type_of_problem == Project.REGRESSION:
                    ruleset._y_train_median = nan

                ruleset = JSONSerializer().serialize(ruleset)
            except DRRulesetFactoriesException as dr_exc:
                if isinstance(dr_exc, DRRuleConclusionFormatException):
                    raise UploadRulesetFactoriesException(
                        "rule_conclusion_format_error",
                        {"conclusion_part": dr_exc.detail.get(
                            "conclusion_part")}
                    )
                elif isinstance(dr_exc, DRRuleConclusionFloatConversionException):
                    raise UploadRulesetFactoriesException(
                        "rule_conclusion_float_conversion_error",
                        {}
                    )
                elif isinstance(dr_exc, DRDecisionAttributeMismatchException):
                    raise UploadRulesetFactoriesException(
                        "decision_attribute_mismatch_error",
                        {
                            "given_attribute": dr_exc.detail.get("given_attribute"),
                            "expected_attribute": dr_exc.detail.get("expected_attribute")
                        }
                    )
                elif isinstance(dr_exc, DRInvalidMeasureNameException):
                    raise UploadRulesetFactoriesException(
                        "invalid_measure_name_error",
                        {}
                    )
                elif isinstance(dr_exc, DRInvalidSurvivalTimeAttributeException):
                    raise UploadRulesetFactoriesException(
                        "invalid_survival_time_attribute_error",
                        {"attribute": dr_exc.detail.get("attribute")}
                    )
                elif isinstance(dr_exc, DRInvalidConditionFormatException):
                    raise UploadRulesetFactoriesException(
                        "invalid_condition_format_error",
                        {"condition_str": dr_exc.detail.get("condition_str")}
                    )
                elif isinstance(dr_exc, DRAttributeNotFoundException):
                    raise UploadRulesetFactoriesException(
                        "attribute_not_found_error",
                        {"attribute_name": dr_exc.detail.get("attribute_name")}
                    )
                elif isinstance(dr_exc, DRInvalidNumericValueException):
                    raise UploadRulesetFactoriesException(
                        "invalid_numeric_value_error",
                        {
                            "operator": dr_exc.detail.get("operator"),
                            "value": dr_exc.detail.get("value")
                        }
                    )
                elif isinstance(dr_exc, DRInvalidValueFormatException):
                    raise UploadRulesetFactoriesException(
                        "invalid_value_format_error",
                        {
                            "operator": dr_exc.detail.get("operator"),
                            "value": dr_exc.detail.get("value")
                        }
                    )
                elif isinstance(dr_exc, DRMissingIfKeywordException):
                    raise UploadRulesetFactoriesException(
                        "missing_if_keyword_error",
                        {
                            "rule": dr_exc.detail.get("rule"),
                        }
                    )
                elif isinstance(dr_exc, DRLordParsingException):
                    raise UploadRulesetFactoriesException(
                        "lord_parsing_error",
                        {}
                    )
                elif isinstance(dr_exc, DRMLRulesParsingException):
                    raise UploadRulesetFactoriesException(
                        "mlrules_parsing_error",
                        {}
                    )

        self.check_attribute_match(ruleset, dataset)
        attributes = self.get_attributes(dataset, ruleset)

        worker_request = self.create_worker_request(
            dataset, data, ruleset, algorithm_params, attributes)

        db_task = calculate_ruleset_indicators(
            worker_request, dataset.project, dataset)

        response_serializer = TaskResponseSerializer(db_task)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def handle_file_upload(self, request, dataset) -> Union[list, dict]:
        file = request.FILES.get('file')
        if not file:
            raise NoFileProvidedException()
        if file.content_type == 'application/json':
            return self.process_json_file(file, dataset)
        elif file.content_type == 'text/plain':
            return self.process_txt_file(file)
        else:
            UnsupportedFileTypeException(file_type=file.content_type)

    def process_json_file(self, file, dataset) -> dict:
        file_data = json.loads(file.read().decode())
        try:
            JSONSerializer.deserialize(
                file_data, RULESET_TYPE_MAPPING[dataset.project.type_of_problem])
        except Exception as e:
            raise RulesetJSONDeserializationException(error_message=str(e))
        return file_data

    def process_txt_file(self, file) -> list:
        list_of_rules = file.read().decode().splitlines()
        return list_of_rules

    def create_worker_request(self, dataset, data, ruleset, algorithm_params, attributes) -> SaveRulesetWorkerRequest:
        ruleset_kwargs = {
            "name": data["name"],
            "description": data.get("description"),
            "attached_to_dataset": dataset.pk,
            "type": Ruleset.Type.MANUAL,
        }
        prediction_config = PredictionConfig(**data['prediction_config'])
        VotingMeasures.validate(
            dataset.project, prediction_config.voting_measure)

        return SaveRulesetWorkerRequest(
            ruleset_kwargs=ruleset_kwargs,
            ruleset=ruleset,
            problem_type=dataset.project.type_of_problem,
            dataset_storage_path=str(dataset.path),
            algorithm_params=algorithm_params,
            attributes=attributes,
            rules_labels={},
            prediction_config=prediction_config,
            type_of_ruleset=data.get("external_algorithm_name"),
        )

    def _select_factory(self, external_algorithm_name: str, problem_type: str):
        factory_mapping = {
            "TEXT": {
                "classification": _factories.classification.TextRuleSetFactory,
                "regression": _factories.regression.TextRuleSetFactory,
                "survival": _factories.survival.TextRuleSetFactory,
            },
            "LORD": {
                "classification": _factories.classification.LordRuleSetFactory,
            },
            "MLRules": {
                "classification": _factories.classification.MLRulesRuleSetFactory,
            },
        }
        type_of_ruleset = external_algorithm_name or "TEXT"

        if type_of_ruleset not in factory_mapping:
            raise ValueError(f"Unsupported type_of_ruleset: {type_of_ruleset}")

        if problem_type not in factory_mapping[type_of_ruleset]:
            raise ValueError(
                f"Type '{type_of_ruleset}' does not support problem type '{problem_type}'."
            )

        return factory_mapping[type_of_ruleset][problem_type]()

    def _sanitize_rules_conclusions(self, ruleset: SurvivalRuleSet):
        for rule in ruleset.rules:
            if rule.conclusion.value == inf:
                rule.conclusion.value = 'inf'

            if rule.conclusion.median_survival_time_ci_lower == inf:
                rule.conclusion.median_survival_time_ci_lower = 'inf'

            if rule.conclusion.median_survival_time_ci_upper == inf:
                rule.conclusion.median_survival_time_ci_upper = 'inf'
