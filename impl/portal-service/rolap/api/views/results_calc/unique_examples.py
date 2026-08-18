from rest_framework import status
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Dataset
from rolap.api.models.indicators import CalculateUniqueExamplesRequest
from rolap.api.serializers.rulesets.rulesets import UniqueExamplesRequestSerializer
from rolap.api.serializers.rulesets.rulesets import UniqueExamplesResponseSerializer
from rolap.api.utils.http import IndicatorHttpService
from rolap.api.views.base import DatasetBaseView


class UniqueExamplesView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_calc']

        def get_request_serializer(self, path, method):
            return UniqueExamplesRequestSerializer()

        def get_response_serializer(self, path, method):
            return UniqueExamplesResponseSerializer()

    schema = _CustomSchema(operation_id_base="unique_examples")
    serializer_class = UniqueExamplesRequestSerializer

    def put(self, request, *args, **kwargs):
        """ Calculates and returns the unique examples based on the provided ruleset and dataset ID.

        Args:
            request (Request): The HTTP request object.
            dataset_id (int):  The ID of the dataset.

        Returns:
            Response: An HTTP response containing the unique examples.
        """
        request_serializer = UniqueExamplesRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        data = request_serializer.validated_data
        dataset: Dataset = self.get_object()
        dataset_path = str(dataset.path)
        project = dataset.project
        type_of_problem = project.type_of_problem

        http_service = IndicatorHttpService()
        payload = {
            "dataset_path": dataset_path,
            "type": type_of_problem,
            "ruleset": data["ruleset"]
        }
        request = CalculateUniqueExamplesRequest(**payload)
        response_data: dict = http_service.calculate_unique_examples(request)
        data = {"unique_examples": response_data}
        serializer = UniqueExamplesResponseSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
