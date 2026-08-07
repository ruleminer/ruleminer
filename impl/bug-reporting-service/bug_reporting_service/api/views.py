from bug_reporting_service.api.models import BugReport
from bug_reporting_service.api.permissions import IsRolapOperator
from bug_reporting_service.api.permissions import IsRolapUser
from bug_reporting_service.api.serializers import BugReportCreateSerializer
from bug_reporting_service.api.serializers import BugReportSerializer
from bug_reporting_service.api.signals import bug_report_submitted
from django.http import FileResponse
from rest_framework import generics
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.exceptions import NotFound
from rest_framework.parsers import FormParser
from rest_framework.parsers import MultiPartParser
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.serializers import CharField


class ReportBugView(generics.ListCreateAPIView):

    parser_classes = [MultiPartParser, FormParser]

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['bugs']

        def get_response_serializer(self, path, method):
            return BugReportSerializer(child=CharField())

        def get_request_serializer(self, path, method):
            return BugReportCreateSerializer

    schema = _CustomSchema(operation_id_base="report_bug")
    serializer_class = BugReportSerializer
    queryset = BugReport.objects.all()

    def get_serializer_class(self):
        if self.request.method == "GET":
            return BugReportSerializer
        elif self.request.method == "POST":
            return BugReportCreateSerializer
        else:
            raise MethodNotAllowed(method=self.request.method)

    def get_permissions(self):
        if self.request.method == "GET":
            # only operators can list bug reports
            self.permission_classes = [IsRolapOperator]
        elif self.request.method == "POST":
            # any user could report a bug
            self.permission_classes = [IsRolapUser]
        else:
            raise MethodNotAllowed(method=self.request.method)
        return super(ReportBugView, self).get_permissions()

    def perform_create(self, serializer: BugReportCreateSerializer):
        serializer.is_valid(raise_exception=True)
        serializer.save(author=self.request.user)
        # send signal
        bug_report_submitted.send(
            sender=self.__class__,
            bug_report=serializer.instance
        )


class BugReportScreenshotView(generics.RetrieveAPIView):

    permission_classes = [IsRolapOperator]
    queryset = BugReport.objects.all()
    lookup_field = 'pk'

    def get(self, request, *args, **kwargs):
        bug_report: BugReport = self.get_object()
        if not bug_report.screenshot.name:
            raise NotFound('Bug report has no screenshot')
        return FileResponse(bug_report.screenshot)
