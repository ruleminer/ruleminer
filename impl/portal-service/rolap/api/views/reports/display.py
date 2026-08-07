from django.http import HttpResponse
from rest_framework.request import Request
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.utils.reports_sftp import download_report_file
from rolap.api.views.base import ReportBaseView


class ReportsDisplaySFTPView(ReportBaseView):
    """
    View for displaying HTML content of the report.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['reports']

        def get_response_serializer(self, path, method):
            return None

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="report_display_sftp")

    def get(self, request: Request, *args, **kwargs):
        report = self.get_object()
        # download bytes from SFTP server
        report_file = download_report_file(report.storage_path)
        return HttpResponse(report_file)
