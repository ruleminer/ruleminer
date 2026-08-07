from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from rest_framework.generics import ListAPIView
from rest_framework.generics import RetrieveAPIView
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.serializers import ValidationError
from rolap.api.exceptions import ProjectNotFoundException
from rolap.api.exceptions import TaskAlreadyCompletedException
from rolap.api.models import Project
from rolap.api.models import Task
from rolap.api.models import TaskType
from rolap.api.permissions import IsRolapUser
from rolap.api.permissions import OwnerPermission
from rolap.api.serializers.tasks import TaskDetailSerializer
from rolap.api.serializers.tasks import TaskListSerializer
from rolap.api.views.base import TaskBaseView
from rolap.api.views.tasks.filters import TaskFilterSet


class TaskDetailView(RetrieveAPIView, TaskBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ["tasks"]

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return TaskDetailSerializer()

    schema = _CustomSchema(operation_id_base="task_detail")
    serializer_class = TaskDetailSerializer


class TasksView(ListAPIView):
    """
    Retrieve the list of all tasks within a given project.
    Tasks can be further filtered by status and type,
    and ordered by create_timestamp, start_timestamp, finish_timestamp, status, and type.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ["tasks"]

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return TaskListSerializer()

        def get_operation(self, path, method):
            operation = super().get_operation(path, method)
            operation['parameters'].append(
                {"name": "limit", "in": "query", "required": False, 'schema': {'type': 'integer'}})
            operation['parameters'].append(
                {"name": "offset", "in": "query", "required": False, 'schema': {'type': 'integer'}})
            return operation

    schema = _CustomSchema(operation_id_base="task_list")
    serializer_class = TaskListSerializer
    permission_classes = [IsRolapUser & OwnerPermission]

    filter_backends = [OrderingFilter, DjangoFilterBackend]
    filterset_class = TaskFilterSet
    ordering_fields = ("create_timestamp", "start_timestamp",
                       "finish_timestamp", "status", "type", )
    ordering = ("-create_timestamp", )

    def get_queryset(self):
        # just to avoid a warning that a view is not compatible with schema generation
        if not self.request:
            return Task.objects.none()
        try:
            project = get_object_or_404(Project, pk=self.kwargs["project_id"])
        except Http404:
            raise ProjectNotFoundException()
        self.check_object_permissions(self.request, project)
        queryset = project.tasks
        queryset = self.filter_queryset(queryset)
        return queryset.all()


class EndTaskBaseView(TaskBaseView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ["tasks"]

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return None

    end_status = None
    end_message = None
    finish = False

    def post(self, *args, **kwargs):
        task = self.get_object()
        self._validate(task)
        if self.finish:
            task.finish_timestamp = timezone.now()
        task.status = self.end_status
        task.save()
        return Response(f"Successfully {self.end_message} task {task.pk}")

    def _validate(self, task):
        if task.status not in [Task.TaskStatus.STARTED, Task.TaskStatus.PENDING]:
            raise TaskAlreadyCompletedException()


class AbortTaskView(EndTaskBaseView):
    schema = EndTaskBaseView._CustomSchema(operation_id_base="task_abort")
    end_status = Task.TaskStatus.ABORTED
    end_message = "aborted"
    finish = True


class StopTaskView(EndTaskBaseView):
    schema = EndTaskBaseView._CustomSchema(operation_id_base="task_stop")
    end_status = Task.TaskStatus.STOPPING
    end_message = "stopped"
    finish = False

    def _validate(self, task):
        if task.type != TaskType.LEARNING:
            raise ValidationError("Only learning tasks can be stopped")
        super()._validate(task)
