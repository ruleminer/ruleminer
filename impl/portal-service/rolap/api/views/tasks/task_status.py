from django.utils import timezone
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.mixins import UpdateModelMixin
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Task
from rolap.api.permissions import IsCeleryWorker
from rolap.api.serializers.tasks import TaskStatusSerializer


class TaskStatusWorkerView(UpdateModelMixin, RetrieveModelMixin, GenericAPIView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ["tasks"]

        def get_request_serializer(self, path, method):
            if method == "PATCH":
                return TaskStatusSerializer()
            else:
                return None

        def get_response_serializer(self, path, method):
            return TaskStatusSerializer()

    queryset = Task.objects.all()
    lookup_url_kwarg = "task_id"
    serializer_class = TaskStatusSerializer
    permission_classes = [IsCeleryWorker, ]

    schema = _CustomSchema(operation_id_base="task_status")

    def perform_update(self, serializer):
        if serializer.instance.status == Task.TaskStatus.PENDING:
            serializer.instance.start_timestamp = timezone.now()
        super().perform_update(serializer)
        if serializer.instance.status in [Task.TaskStatus.SUCCESS, Task.TaskStatus.FAILURE]:
            serializer.instance.finish_timestamp = timezone.now()
        serializer.instance.save()

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)
