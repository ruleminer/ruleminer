from rest_framework.mixins import RetrieveModelMixin
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.serializers.reports import DatasetReportsSerializer
from rolap.api.views.base import DatasetBaseView


class DatasetReportListView(RetrieveModelMixin, DatasetBaseView):
    """Get reports associated with the dataset."""
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return DatasetReportsSerializer(many=True)

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="dataset_report_list")
    serializer_class = DatasetReportsSerializer

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)
