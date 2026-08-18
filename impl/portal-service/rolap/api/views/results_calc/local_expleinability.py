from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import InvalidRequestException
from rolap.api.exceptions import RulesetNotFoundException
from rolap.api.models.datasets import Dataset
from rolap.api.models.indicators import LocalExplainabilityRequest
from rolap.api.models.projects import Project
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.serializers.rulesets.rulesets import RequestExplainabilitySerializer
from rolap.api.serializers.rulesets.rulesets import ResponseExplainabilitySerializer
from rolap.api.utils.http import IndicatorHttpService
from rolap.api.views.base import DatasetBaseView


class LocalExplainabilityView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_calc']

        def get_request_serializer(self, path, method):
            return RequestExplainabilitySerializer()

        def get_response_serializer(self, path, method):
            return ResponseExplainabilitySerializer()

    schema = _CustomSchema(operation_id_base="local_explainability")
    serializer_class = RequestExplainabilitySerializer

    def put(self, request: Request, *args, **kwargs) -> Response:
        """Performs calculations on the record sent in the request.

        Args:
            request (Request): The HTTP request object.
        Returns:
            Response: An HTTP response containing the calculation results.
        """
        indicator_service = IndicatorHttpService()
        data = request.data
        request_serializer = RequestExplainabilitySerializer(data=data)
        request_serializer.is_valid(raise_exception=True)
        dataset: Dataset = self.get_object()
        project: Project = dataset.project
        try:
            original_ruleset: Ruleset = get_object_or_404(
                Ruleset, pk=request_serializer.data['original_ruleset_id']
            )
        except Http404:
            raise RulesetNotFoundException()
        type_of_problem: str = project.type_of_problem
        ruleset = request_serializer.validated_data["ruleset"]
        examples = request_serializer.validated_data["examples"]
        coverage = request_serializer.validated_data["rule_coverage"]
        meta = ruleset["meta"]
        attributes = set(meta["attributes"])
        # check if all examples have required attributes (i.e. those in the ruleset)
        if not all(attributes.issubset(example) for example in examples):
            raise InvalidRequestException(
                "One or more attributes required in the ruleset are missing in one or more of the examples.")

        # get prediction config and update it from request
        prediction_config = original_ruleset.get_updated_config(
            request_serializer.data.get('prediction_config', {})
        )

        payload = LocalExplainabilityRequest(
            examples=examples,
            type=type_of_problem,
            ruleset=ruleset,
            rule_coverage=coverage,
            prediction_config=prediction_config
        )
        explanation_data = indicator_service.local_explainability(payload)
        response_serializer = ResponseExplainabilitySerializer(
            data=explanation_data, many=True)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
