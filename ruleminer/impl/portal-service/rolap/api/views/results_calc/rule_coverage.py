from typing import Any

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.serializers.rulesets.rulesets import CoverageSerializer
from rolap.api.serializers.rulesets.rulesets import RulesetSerializer
from rolap.api.utils.http import IndicatorHttpService
from rolap.api.views.base import DatasetBaseView


class DeterminationRuleCoverageView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_calc']

        def get_request_serializer(self, path, method):
            return RulesetSerializer()

        def get_response_serializer(self, path, method):
            return CoverageSerializer()

    schema = _CustomSchema(operation_id_base="determination_rule_coverage")
    serializer_class = RulesetSerializer

    def put(self, request: Request, *args, **kwargs) -> Response:
        """  Calculates and returns the rule coverage information based on the provided ruleset and dataset ID.

        Args:
            request (Request): The HTTP request object.
            dataset_id (int):  The ID of the dataset.

        Returns:
            Response: An HTTP response containing the rule coverage information.
        """
        request_serializer = RulesetSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        dataset: Dataset = self.get_object()
        dataset_path: str = str(dataset.path)
        project: Project = dataset.project
        type_of_problem: str = project.type_of_problem

        http_service = IndicatorHttpService()
        payload: dict[str, Any] = {
            "dataset_path": dataset_path,
            "type": type_of_problem,
            "ruleset": request.data
        }
        response_data: dict = http_service.calculate_rule_coverage(payload)
        data = {"rule_coverage": response_data}
        serializer: CoverageSerializer = CoverageSerializer(
            data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
