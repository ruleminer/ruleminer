from rest_framework.generics import RetrieveDestroyAPIView
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.serializers.reports import ReportMetadataSerializer
from rolap.api.views.base import ReportBaseView


class ReportMetadataView(RetrieveDestroyAPIView, ReportBaseView):
    """
    View for displaying metadata about a report or deleting it.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['reports']

        def get_response_serializer(self, path, method):
            return ReportMetadataSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="report_metadata")
    serializer_class = ReportMetadataSerializer
