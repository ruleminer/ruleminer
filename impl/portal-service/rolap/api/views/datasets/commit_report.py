from django.utils import timezone
from rest_framework import status
from rest_framework.mixins import UpdateModelMixin
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Task
from rolap.api.permissions import IsCeleryWorker
from rolap.api.serializers.reports import CreateDatasetReportSerializer
from rolap.api.views.base import DatasetBaseView


class DatasetReportResultView(UpdateModelMixin, DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return None

        def get_request_serializer(self, path, method):
            return CreateDatasetReportSerializer()

    permission_classes = [IsCeleryWorker, ]
    schema = _CustomSchema(operation_id_base="dataset_commit_report")
    serializer_class = CreateDatasetReportSerializer

    def patch(self, request, *args, **kwargs):
        dataset = self.get_object()
        # get new report data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # extract task id
        task_id = serializer.validated_data.pop("celery_task")
        task = Task.objects.get(pk=task_id)
        # create new report
        report = dataset.reports.create(**serializer.validated_data)
        task.result_object = report
        task.status = Task.TaskStatus.SUCCESS
        task.finish_timestamp = timezone.now()
        task.save()
        # return success response
        return Response(status=status.HTTP_201_CREATED)
