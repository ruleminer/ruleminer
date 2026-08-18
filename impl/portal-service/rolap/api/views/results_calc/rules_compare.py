from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.views import APIView
from rolap.api.exceptions import InvalidRequestException
from rolap.api.models.datasets import Dataset
from rolap.api.models.indicators import CalculateRuleSimilarityRequest
from rolap.api.models.projects import Project
from rolap.api.permissions import IsRolapUser
from rolap.api.serializers.rulesets.rulesets import RuleSimilarityRequestSerializer
from rolap.api.serializers.rulesets.rulesets import RuleSimilaritySerializer
from rolap.api.utils.http import IndicatorHttpService
from rolap.api.views.base import DatasetBaseView


MEASURES = ["Jaccard", "Correlation", "Kulczynski"]


class MeasuresListView(APIView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_calc']

    schema = _CustomSchema(operation_id_base="measures-list")
    permission_classes = [IsRolapUser, ]

    def get(self, request: Request) -> Response:
        """Retrieve a list of available rule comparison measures.

        This endpoint returns a list of available measures that can be used to compare rules.

        Returns:
            Response: An HTTP response containing the list of available measures.
        """
        return Response(MEASURES, status=status.HTTP_200_OK)


class RuleSimilarityView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_calc']

        def get_response_serializer(self, path, method):
            return RuleSimilaritySerializer()

        def get_request_serializer(self, path, method):
            return RuleSimilarityRequestSerializer()

    schema = _CustomSchema(operation_id_base="rule-similarity")

    def put(self, request: Request, *args, **kwargs) -> Response:
        """Calculate the similarity between two sets of rules based on the given measure.
        Args:
            request (Request): HTTP request object containing the input data.
            dataset_id (int): ID of the dataset to use for calculations.

        Returns:
            Response: HTTP response containing the calculated rule similarity.
        """
        # get dataset and check permissions
        dataset: Dataset = self.get_object()
        # parse request data
        data = request.data
        request_serializer = RuleSimilarityRequestSerializer(data=data)
        request_serializer.is_valid(raise_exception=True)
        similarity_type = request_serializer.validated_data["similarity_type"]
        measure = request_serializer.validated_data.get("measure")
        ruleset1 = request_serializer.validated_data["ruleset_1"]
        ruleset2 = request_serializer.validated_data["ruleset_2"]
        dataset_attributes = set(
            dataset.attributes.values_list("name", flat=True))
        # check if attributes match
        if set(ruleset1["meta"]["attributes"]) - dataset_attributes or set(ruleset2["meta"]["attributes"]) - dataset_attributes:
            raise InvalidRequestException(
                "Ruleset attributes do not match the dataset attributes")
        # get project and dataset information
        project: Project = dataset.project
        type_of_problem: str = project.type_of_problem
        dataset_path: str = str(dataset.path)
        # call RES
        http_service = IndicatorHttpService()
        payload = CalculateRuleSimilarityRequest(
            dataset_path=dataset_path, type=type_of_problem, measure=measure,
            ruleset1=ruleset1, ruleset2=ruleset2, similarity_type=similarity_type,
        )
        response_data: dict = http_service.calculate_rule_similarity(payload)
        data = {"rule_similarity": response_data}
        # return results
        serializer: RuleSimilaritySerializer = RuleSimilaritySerializer(
            data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
