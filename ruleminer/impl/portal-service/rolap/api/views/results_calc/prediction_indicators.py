from django.http import Http404
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import RulesetNotFoundException
from rolap.api.models.datasets import Dataset
from rolap.api.models.indicators import CalculatePredictionIndicatorsRequest
from rolap.api.models.projects import Project
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.serializers.results import PredictionIndicatorsSerializer
from rolap.api.serializers.rulesets.rulesets import RequestRulesetSerializer
from rolap.api.utils.http import IndicatorHttpService
from rolap.api.views.base import DatasetBaseView


class DeterminationPredictionIndicatorsView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_calc']

        def get_request_serializer(self, path, method):
            return RequestRulesetSerializer()

        def get_response_serializer(self, path, method):
            return PredictionIndicatorsSerializer()

    schema = _CustomSchema(
        operation_id_base="determination_prediction_indicators")
    serializer_class = RequestRulesetSerializer

    def __init__(
        self,
        http_client_service: IndicatorHttpService = None
    ):
        super().__init__()
        self.http_client_service: IndicatorHttpService = (
            http_client_service if http_client_service is not None else
            IndicatorHttpService()
        )

    def put(self, request: Request, *args, **kwargs) -> Response:
        """Determines the prediction indicators for the sent set of rules with rule coverage and given dataset.

        Args:
            request (Request): The HTTP request object.
            dataset_id (int): The ID of the dataset.

        Returns:
            Response: An HTTP response containing the determined prediction indicators.
        """
        request_serializer: RequestRulesetSerializer = RequestRulesetSerializer(
            data=request.data)
        request_serializer.is_valid(raise_exception=True)

        dataset: Dataset = self.get_object()
        dataset_path: str = str(dataset.path)
        project: Project = dataset.project
        type_of_problem: str = project.type_of_problem
        # fetch original ruleset to use the same voting measure for the edited one
        try:
            original_ruleset: Ruleset = get_object_or_404(
                Ruleset, pk=request_serializer.data['original_ruleset_id']
            )
        except Http404:
            raise RulesetNotFoundException()

        # get prediction config and update it from request
        prediction_config = original_ruleset.get_updated_config(
            request_serializer.data.get('prediction_config', {})
        )

        response = self.http_client_service.calculate_prediction_indicators(
            CalculatePredictionIndicatorsRequest(
                dataset_path=dataset_path,
                type=type_of_problem,
                ruleset=request.data['ruleset'],
                rule_coverage=request.data['rule_coverage'],
                prediction_config=prediction_config
            )
        )
        serializer: PredictionIndicatorsSerializer = PredictionIndicatorsSerializer(
            data=response
        )
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
