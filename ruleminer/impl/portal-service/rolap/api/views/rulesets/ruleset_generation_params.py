from rest_framework import status
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Ruleset
from rolap.api.serializers.rulesets.rulesets import RulesetGenerationAlgorithmParamsSerializer
from rolap.api.views.base import RulesetBaseView


class RulesetGenerationAlgorithmParamsView(RulesetBaseView):
    """Retrieves the algorithm parameters used to generate the given ruleset.

            Args:
                request (Request): The HTTP request object.
                dataset_id (int): The ID of the dataset.
                ruleset_id (int): The ID of the ruleset.

            Returns:
                Response: An HTTP response containing the generation params.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets']

        def get_response_serializer(self, path, method):
            return RulesetGenerationAlgorithmParamsSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="ruleset_generation_params")
    serializer_class = RulesetGenerationAlgorithmParamsSerializer

    def get(self, *args, **kwargs):
        ruleset: Ruleset = self.get_object()
        generation_params: dict = ruleset.generation_params.get(
            "algorithm_params", {})
        ruleset_generation_params: dict = {
            'generation_algorithm_params': generation_params}
        serializer: RulesetGenerationAlgorithmParamsSerializer = self.serializer_class(
            ruleset_generation_params)
        return Response(serializer.data, status=status.HTTP_200_OK)
