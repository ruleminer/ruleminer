from django.db.models import QuerySet
from django.http import Http404
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import DatasetNotFoundException
from rolap.api.exceptions import InvalidRequestException
from rolap.api.exceptions import MultipleRulesetsNotFoundException
from rolap.api.models.datasets import Dataset
from rolap.api.models.indicators import CalculatePredictionSummaryRequest
from rolap.api.models.indicators import RulesetWithCoverage
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.serializers.indicators.indicators import \
    RuleDBCoverageSerializer
from rolap.api.serializers.results import PredictionSummaryCalculatedSerializer
from rolap.api.serializers.rulesets.rulesets import \
    PredictionSummaryRequestSerializer
from rolap.api.utils.http import IndicatorHttpService
from rolap.api.views.base import DatasetBaseView


class DeterminationPredictionIndicatorsSummaryView(DatasetBaseView):
    """
    Calculates prediction indicators for a set of rulesets attached to a given dataset
    when applied to a selected compatible test dataset.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_calc']

        def get_request_serializer(self, path, method):
            return PredictionSummaryRequestSerializer()

        def get_response_serializer(self, path, method):
            return PredictionSummaryCalculatedSerializer()

    schema = _CustomSchema(
        operation_id_base="determination_prediction_indicators_summary")
    serializer_class = PredictionSummaryCalculatedSerializer
    pagination_class = None

    def __init__(
        self,
        http_client_service: IndicatorHttpService = None
    ):
        super().__init__()
        self.http_client_service: IndicatorHttpService = (
            http_client_service if http_client_service is not None else
            IndicatorHttpService()
        )

    def post(self, request: Request, *args, **kwargs):
        # get dataset and data
        dataset: Dataset = self.get_object()

        # parse request
        request_serializer: PredictionSummaryRequestSerializer = PredictionSummaryRequestSerializer(
            data=request.data)
        request_serializer.is_valid(raise_exception=True)
        test_dataset_id = request_serializer.validated_data["dataset_id"]
        ruleset_ids = request_serializer.validated_data["ruleset_ids"]

        # get test dataset
        test_dataset = self._get_test_dataset(request, test_dataset_id)
        self._check_compatibility(dataset, test_dataset)

        # get rulesets
        rulesets = dataset.attached_rulesets
        if ruleset_ids:
            rulesets = rulesets.filter(id__in=ruleset_ids)
            # check if all rulesets we were trying to filter are actually attached to the dataset
            found_ids = rulesets.values_list("id", flat=True)
            difference = set(ruleset_ids) - set(found_ids)
            if difference:
                raise MultipleRulesetsNotFoundException(list(difference))
        rulesets = rulesets.all()

        # calculate prediction indicators with RES
        request: CalculatePredictionSummaryRequest = self._create_request(
            rulesets, test_dataset)
        res_response = self.http_client_service.calculate_prediction_summary(
            request)

        # parse response
        response = PredictionSummaryCalculatedSerializer(
            data=res_response, many=True)
        response.is_valid()

        return Response(response.data)

    def _get_test_dataset(self, request: Request, test_dataset_id: int):
        try:
            test_dataset = get_object_or_404(Dataset, pk=test_dataset_id)
        except Http404:
            raise DatasetNotFoundException()
        self.check_object_permissions(request, test_dataset)
        self.check_dataset_compliance(test_dataset)
        return test_dataset

    def _get_ruleset_coverage(self, ruleset: Ruleset):
        rules = ruleset.rules.all()
        coverage = RuleDBCoverageSerializer(rules, many=True)
        coverage = {
            rule["uuid"]: {**rule, **rule["indicators"]} for rule in coverage.data
        }
        return coverage

    def _check_compatibility(self, dataset: Dataset, test_dataset: Dataset):
        if dataset.project != test_dataset.project:
            raise InvalidRequestException(
                "Datasets must belong to the same project")
        source_attributes = dataset.attributes.values_list("name", "type")
        test_attributes = test_dataset.attributes.values_list("name", "type")
        if set(source_attributes) - set(test_attributes):
            raise InvalidRequestException(
                "Test dataset must contain all attributes of the source dataset")

    def _create_request(self, rulesets: QuerySet, test_dataset: Dataset) -> CalculatePredictionSummaryRequest:
        rulesets_with_coverage = []
        prediction_configs = []
        for ruleset in rulesets:
            rulesets_with_coverage.append(
                RulesetWithCoverage(
                    id=ruleset.id,
                    name=ruleset.name,
                    ruleset=ruleset.ruleset,
                    rule_coverage=self._get_ruleset_coverage(ruleset),
                    voting_measure=ruleset.voting_measure
                )
            )
            prediction_configs.append(ruleset.prediction_config)
        return CalculatePredictionSummaryRequest(
            dataset_path=str(test_dataset.path),
            type=test_dataset.project.type_of_problem,
            rulesets=rulesets_with_coverage,
            prediction_configs=prediction_configs
        )
