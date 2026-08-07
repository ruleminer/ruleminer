from rest_framework import status
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models.reports import Report
from rolap.api.serializers.reports import ReportRenameSerializer
from rolap.api.views.base import ReportBaseView
from rolap.api.exceptions import ReportExistsException


class ModifyReportView(ReportBaseView):
    """
    View for updating title of the report.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['reports']

        def get_response_serializer(self, path, method):
            return None

        def get_request_serializer(self, path, method):
            return ReportRenameSerializer

    schema = _CustomSchema(operation_id_base="report_modify")

    serializer_class = ReportRenameSerializer

    def patch(self, request, *args, **kwargs):
        report = self.get_object()

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            new_title = serializer.validated_data.get('title')

            if Report.objects.filter(content_type=report.content_type, object_id=report.object_id, title=new_title).exclude(pk=report.pk).exists():
                raise ReportExistsException()

            report.title = new_title
            report.save()

            return Response({"message": "Report name updated successfully."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
