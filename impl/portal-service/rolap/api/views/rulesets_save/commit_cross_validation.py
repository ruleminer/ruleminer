from django.utils import timezone
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Task
from rolap.api.permissions import IsCeleryWorker
from rolap.api.serializers.rulesets.cross_validation import CrossValidationResultRequestSerializer


class CrossValidationUploadResultView(CreateAPIView):
    serializer_class = CrossValidationResultRequestSerializer
    permission_classes = [IsCeleryWorker, ]

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets_save']

        def get_request_serializer(self, path, method):
            return CrossValidationResultRequestSerializer()

        def get_response_serializer(self, path, method):
            pass

    schema = _CustomSchema(operation_id_base="cross_validation_upload_result")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # extract task id and get task
        task_id = serializer.validated_data.pop("celery_task")
        task = Task.objects.get(task_id=task_id)
        # extract extra info
        extra_info = serializer.validated_data.pop("extra_info", {})
        # create CV result and attach to task
        self.perform_create(serializer)
        task.result_object = serializer.instance.ruleset
        if extra_info:
            task.meta.update(extra_info)
        task.status = Task.TaskStatus.SUCCESS
        task.finish_timestamp = timezone.now()
        task.save()
        # return response
        return Response(status=status.HTTP_201_CREATED)
