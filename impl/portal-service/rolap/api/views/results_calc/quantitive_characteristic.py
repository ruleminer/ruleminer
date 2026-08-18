import dataclasses
from typing import Any

from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import RulesetNotFoundException
from rolap.api.models import Ruleset
from rolap.api.models.datasets import Dataset
from rolap.api.models.indicators import CalculateCharacteristicsRequest
from rolap.api.models.indicators import QuantitativeCharacteristics
from rolap.api.models.projects import Project
from rolap.api.serializers.results import QuantitativeCharacteristicsSerializer
from rolap.api.serializers.rulesets.rulesets import RequestRulesetSerializer
from rolap.api.utils.http import IndicatorHttpService
from rolap.api.views.base import DatasetBaseView


class DeterminationQuantitativeCharacteristicsView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_calc']

        def get_request_serializer(self, path, method):
            return RequestRulesetSerializer()

        def get_response_serializer(self, path, method):
            return QuantitativeCharacteristicsSerializer()

    schema = _CustomSchema(
        operation_id_base="determination_quantitative_characteristics")

    def __init__(
        self,
        indicator_service: IndicatorHttpService = None,
        **kwargs: Any
    ) -> None:
        if indicator_service is None:
            self.indicator_service = IndicatorHttpService()
        super().__init__(**kwargs)

    def put(self, request: Request, *args, **kwargs) -> Response:
        """Calculates and returns the quantitative characteristics for the sent set of rules with rule coverage and given dataset.

        Args:
            request (Request): The HTTP request object.
            dataset_id (int):  The ID of the dataset.

        Returns:
            Response: An HTTP response containing the quantitative characteristics.
        """
        request_serializer: RequestRulesetSerializer = RequestRulesetSerializer(
            data=request.data)
        request_serializer.is_valid(raise_exception=True)

        dataset: Dataset = self.get_object()
        dataset_path: str = str(dataset.path)
        project: Project = dataset.project
        type_of_problem: str = project.type_of_problem
        try:
            original_ruleset: Ruleset = get_object_or_404(
                Ruleset, pk=request_serializer.data.get('original_ruleset_id')
            )
        except Http404:
            raise RulesetNotFoundException()

        # get prediction config and update it from request
        prediction_config = original_ruleset.get_updated_config(
            request_serializer.data.get('prediction_config', {})
        )

        response: QuantitativeCharacteristics = self.indicator_service.calculate_characteristic(
            CalculateCharacteristicsRequest(
                type=type_of_problem,
                ruleset=request.data['ruleset'],
                rule_coverage=request.data['rule_coverage'],
                voting_measure=prediction_config.voting_measure,
                dataset_path=dataset_path
            )
        )
        response_dict = dataclasses.asdict(response)

        serializer = QuantitativeCharacteristicsSerializer(
            data=response_dict
        )
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
