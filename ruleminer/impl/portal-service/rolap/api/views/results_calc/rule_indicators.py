from typing import Union

from decision_rules.classification.metrics import ClassificationRulesMetrics
from decision_rules.core.metrics import AbstractRulesMetrics
from decision_rules.regression.metrics import RegressionRulesMetrics
from decision_rules.survival.metrics import SurvivalRulesMetrics
from rest_framework import serializers
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import InvalidRequestException
from rolap.api.models.datasets import Dataset
from rolap.api.models.indicators import CalculateHistogramRequest
from rolap.api.models.indicators import CalculateIndicatorsRequest
from rolap.api.models.indicators import CalculateSingleRuleIndicatorsRequest
from rolap.api.models.projects import Project
from rolap.api.serializers.results import HistogramsSerializer
from rolap.api.serializers.results import IndicatorsSerializer
from rolap.api.serializers.results import RulesDataSerializer
from rolap.api.serializers.rulesets.rulesets import RequestHistogramRulesetSerializer
from rolap.api.serializers.rulesets.rulesets import RequestRulesIndicatorsSerializer
from rolap.api.serializers.rulesets.rulesets import RequestSingleRuleIndicatorsSerializer
from rolap.api.serializers.rulesets.rulesets import RuleAvailableIndicatorsSerializer
from rolap.api.serializers.rulesets.rulesets import SingleRuleIndicatorsSerializer
from rolap.api.utils.http import IndicatorHttpService
from rolap.api.views.base import DatasetBaseView
from rolap.api.views.base import ProjectBaseView


class DeterminationRulesIndicatorsView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_calc']

        def get_request_serializer(self, path, method):
            return RequestRulesIndicatorsSerializer()

        def get_response_serializer(self, path, method):
            return RulesDataSerializer()

    schema = _CustomSchema(operation_id_base="determination_rules_indicators")
    serializer_class = RequestRulesIndicatorsSerializer

    def put(self, request: Request, *args, **kwargs) -> Response:
        """Calculates and returns the rules indicators for the sent set of rules with rule coverage and given dataset.

        Args:
            request (Request): The HTTP request object.
            dataset_id (int): The ID of the dataset.

        Returns:
            Response: An HTTP response containing the calculated rules indicators.
        """
        indicator_service = IndicatorHttpService()
        request_serializer = RequestRulesIndicatorsSerializer(
            data=request.data)
        request_serializer.is_valid(raise_exception=True)

        dataset: Dataset = self.get_object()
        dataset_path: str = str(dataset.path)
        project: Project = dataset.project
        type_of_problem: str = project.type_of_problem
        request_serializer.is_valid(raise_exception=True)
        bins: int = request_serializer.validated_data["bins"]
        payload_indicators = CalculateIndicatorsRequest(
            dataset_path=dataset_path,
            type=type_of_problem,
            ruleset=request.data['ruleset'],
            rule_coverage=request.data['rule_coverage']
        )

        indicators_data = indicator_service.calculate_rules_indicators(
            payload_indicators)
        serializer_indicators = IndicatorsSerializer(
            data=indicators_data, many=True)
        serializer_indicators.is_valid(raise_exception=True)
        if type_of_problem.lower() == "regression":
            payload_histograms: dict = {
                "dataset_path": dataset_path,
                "type": type_of_problem,
                "bins": bins,
                "ruleset": request.data['ruleset'],
            }
            histogram_data = indicator_service.calculate_histograms(
                payload_histograms)
            serializer_histograms = HistogramsSerializer(
                data=histogram_data)
            serializer_histograms.is_valid(raise_exception=True)
            response_data = {
                "indicators_data": serializer_indicators.validated_data,
                "histograms_data": serializer_histograms.validated_data
            }
        else:
            response_data = {
                "indicators_data": serializer_indicators.validated_data
            }
        rule_data_serializer = RulesDataSerializer(data=response_data)
        rule_data_serializer.is_valid(raise_exception=True)
        return Response(rule_data_serializer.validated_data, status=status.HTTP_200_OK)


class DeterminationSingleRuleIndicatorsView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_calc']

        def get_request_serializer(self, path, method):
            return RequestSingleRuleIndicatorsSerializer()

        def get_response_serializer(self, path, method):
            return SingleRuleIndicatorsSerializer()

    schema = _CustomSchema(
        operation_id_base="determination_single_rule_indicators"
    )
    serializer_class = RequestRulesIndicatorsSerializer

    def put(self, request: Request, *args, **kwargs) -> Response:
        """Calculates and returns the single rule indicators for the sent rule and given dataset.

        Args:
            request (Request): The HTTP request object.
            dataset_id (int): The ID of the dataset.

        Returns:
            Response: An HTTP response containing the calculated indicators of the rule.
        """
        indicator_service = IndicatorHttpService()
        request_serializer = RequestSingleRuleIndicatorsSerializer(
            data=request.data)
        request_serializer.is_valid(raise_exception=True)

        dataset: Dataset = self.get_object()
        project: Project = dataset.project
        payload_indicators = CalculateSingleRuleIndicatorsRequest(
            dataset_path=str(dataset.path),
            type=project.type_of_problem,
            rule=request_serializer.validated_data['rule'],
            attributes=request_serializer.validated_data['attributes'],
            decision_attribute=dataset.class_attribute,
            survival_time_attribute=dataset.survival_time_attribute,
            metrics_to_calculate=request_serializer.validated_data.get(
                'metrics_to_calculate'
            ),
        )
        indicators_data: dict[str, Union[float, int]] = indicator_service.calculate_single_rule_indicators(
            payload_indicators)
        serializer = SingleRuleIndicatorsSerializer(
            data={'indicators': indicators_data})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data.get('indicators'), status=status.HTTP_200_OK)


class DeterminationHistogramsView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_calc']

        def get_request_serializer(self, path, method):
            return RequestHistogramRulesetSerializer()

        def get_response_serializer(self, path, method):
            return HistogramsSerializer()

    schema = _CustomSchema(operation_id_base="get_rule_indicators")
    serializer_class = RulesDataSerializer

    def put(self, request: Request, *args, **kwargs) -> Response:
        """Calculates and returns the histograms for chosen rules given in the sent set of rules.

        Args:
            request (Request): The HTTP request object.
            dataset_id (int): The ID of the dataset.

        Returns:
            Response: An HTTP response containing the calculated rules indicators.
        """
        indicator_service = IndicatorHttpService()
        request_serializer: RequestHistogramRulesetSerializer = RequestHistogramRulesetSerializer(
            data=request.data)
        request_serializer.is_valid(raise_exception=True)

        dataset: Dataset = self.get_object()
        dataset_path: str = str(dataset.path)
        project: Project = dataset.project
        type_of_problem: str = project.type_of_problem
        if type_of_problem.lower() != "regression":
            raise InvalidRequestException(
                f"Histogram for {type_of_problem} is not supported yet")
        request_serializer.is_valid(raise_exception=True)
        bins: int = request_serializer.validated_data["bins"]
        for_rules: list = request_serializer.validated_data.get(
            "for_rules", None)

        payload_histograms: CalculateHistogramRequest = {
            "dataset_path": dataset_path,
            "type": type_of_problem,
            "bins": bins,
            "for_rules": for_rules,
            "ruleset": request.data['ruleset'],
        }
        histogram_data = indicator_service.calculate_histograms(
            payload_histograms)
        serializer_histograms = HistogramsSerializer(
            data=histogram_data)
        serializer_histograms.is_valid(raise_exception=True)
        return Response(serializer_histograms.validated_data, status=status.HTTP_200_OK)


class RuleAvailableIndicatorsListView(ProjectBaseView):
    """
    List all available rule indicators for given project's type
    """

    lookup_url_kwarg = 'project_id'
    pagination_class = None
    serializer_class = RuleAvailableIndicatorsSerializer

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['lists']

        def get_response_serializer(self, path, method):
            return serializers.ListField(child=serializers.CharField())

    schema = _CustomSchema(operation_id_base="get_rule_available_indicators")

    def get(self, request: Request, **kwargs) -> Response:
        project: Project = self.get_object()
        problem_type = project.type_of_problem
        metrics_class: type = {
            Project.CLASSIFICATION: ClassificationRulesMetrics,
            Project.REGRESSION: RegressionRulesMetrics,
            Project.SURVIVAL: SurvivalRulesMetrics,
        }[problem_type]
        metrics: AbstractRulesMetrics = metrics_class([])
        supported_metrics: list[str] = metrics.supported_metrics
        # remove `p_unique` and `n_unique` from supported metrics
        supported_metrics = list(
            filter(lambda x: x not in ["p_unique",
                   "n_unique"], supported_metrics)
        )
        serializer: RuleAvailableIndicatorsSerializer = self.get_serializer(
            data={'indicators': supported_metrics}
        )
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data.get('indicators'), status=status.HTTP_200_OK)
