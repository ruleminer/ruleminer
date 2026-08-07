from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import RulesetNotFoundException
from rolap.api.models.datasets import Dataset
from rolap.api.models.indicators import CalculatePredictionRequest
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.serializers.rulesets.rulesets import \
    CoverageMatrixRequestSerializer
from rolap.api.utils.http import IndicatorHttpService
from rolap.api.views.base import DatasetBaseView


class PredictionView(DatasetBaseView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['results_calc']

        def get_request_serializer(self, path, method):
            return CoverageMatrixRequestSerializer()

    schema = _CustomSchema(operation_id_base="prediction")
    serializer_class = CoverageMatrixRequestSerializer

    def put(self, request: Request, dataset_id: int):
        """Calculates and returns the predictions based on the provided ruleset and dataset ID
        for the specified dataset rows.

        Args:
            request (Request): The HTTP request object.
            dataset_id (int): The ID of the dataset.

        Returns:
            Response: An HTTP response containing the prediction data.
                      The response data is expected to be a dictionary with integer keys from 0 to 147
                      and values as predictions (e.g., "Iris-setosa", "Iris-versicolor", "Iris-virginica").
        """
        request_serializer = CoverageMatrixRequestSerializer(
            data=request.data
        )
        request_serializer.is_valid(raise_exception=True)

        dataset: Dataset = self.get_object()
        dataset_path = str(dataset.path)
        type_of_problem = dataset.project.type_of_problem
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

        payload = CalculatePredictionRequest(
            dataset_path=dataset_path,
            type=type_of_problem,
            ruleset=request_serializer.data.get('ruleset'),
            rule_coverage=request_serializer.data.get('rule_coverage'),
            example_indices=request_serializer.data.get('example_indices'),
            prediction_config=prediction_config
        )
        indicator_service = IndicatorHttpService()
        data = indicator_service.calculate_prediction(payload)
        return Response(data, status=status.HTTP_200_OK)
