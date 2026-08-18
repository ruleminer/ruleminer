from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.serializers.results import PredictionIndicatorsListSerializer
from rolap.api.views.base import DatasetBaseView


class PredictionIndicatorsListView(DatasetBaseView):
    """
    Retrieves predictions indicators of all rulesets attached to a given dataset.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_db']

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return PredictionIndicatorsListSerializer()

    schema = _CustomSchema(operation_id_base="prediction_indicators_summary")
    serializer_class = PredictionIndicatorsListSerializer
    pagination_class = None

    def get(self, *args, **kwargs):
        dataset = self.get_object()
        rulesets = dataset.attached_rulesets.all()
        serializer = self.get_serializer(rulesets, many=True)
        return Response(serializer.data)
