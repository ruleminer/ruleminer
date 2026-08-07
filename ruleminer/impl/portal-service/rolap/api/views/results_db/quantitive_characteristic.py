from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.serializers.results import QuantitativeCharacteristicsListSerializer
from rolap.api.serializers.results import QuantitativeCharacteristicsSerializer
from rolap.api.views.base import DatasetBaseView
from rolap.api.views.base import RulesetBaseView


class QuantitativeCharacteristicsView(RetrieveAPIView, RulesetBaseView):
    """Retrieves the quantitative characteristics for a given dataset and ruleset.

            Args:
                request (Request): The HTTP request object.
                dataset_id (int): The ID of the dataset.
                ruleset_id (int): The ID of the ruleset.

            Returns:
                Response: An HTTP response containing the quantitative characteristics.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_db']

        def get_response_serializer(self, path, method):
            return QuantitativeCharacteristicsSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="quantitative_characteristics")
    serializer_class = QuantitativeCharacteristicsSerializer


class QuantitativeCharacteristicsListView(DatasetBaseView):
    """
    Retrieves the quantitative characteristics for all rulesets attached to a given dataset.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_db']

        def get_response_serializer(self, path, method):
            return QuantitativeCharacteristicsListSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(
        operation_id_base="quantitative_characteristics_summary")
    serializer_class = QuantitativeCharacteristicsListSerializer
    pagination_class = None

    def get(self, request: Request, *args, **kwargs):
        dataset = self.get_object()
        rulesets = dataset.attached_rulesets.all()
        serializer = self.serializer_class(rulesets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
