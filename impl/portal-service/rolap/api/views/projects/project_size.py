from django.core.exceptions import PermissionDenied
from django.db.models import BooleanField
from django.db.models import Case
from django.db.models import Count
from django.db.models import Q
from django.db.models import Sum
from django.db.models import When
from django.http import Http404
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from rest_framework.generics import ListAPIView
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import ProjectNotFoundException
from rolap.api.models import Project
from rolap.api.permissions import IsRolapUser
from rolap.api.permissions import OwnerPermission
from rolap.api.serializers.projects import DatasetSizeSerializer
from rolap.api.serializers.projects import ProjectSizeSerializer
from rolap.api.utils.limits import UserLimits
from rolap.api.views.projects.filters import ProjectFilterSet


class ProjectSizeListView(ListAPIView):
    """
    List all projects belonging to a given user,
    with information about size and number of datasets, rulesets, and reports.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['projects']

        def get_response_serializer(self, path, method):
            return ProjectSizeSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="project_size_list")
    permission_classes = [IsRolapUser]
    serializer_class = ProjectSizeSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering = ("-last_opened_at", )
    filterset_class = ProjectFilterSet

    def get_queryset(self):
        # just to avoid a warning that a view is not compatible with schema generation
        if not self.request:
            return Project.objects.none()
        return Project.objects.filter(owner=self.request.user).annotate(
            ruleset_count=Count("datasets__attached_rulesets", distinct=True),
            report_count=Count("datasets__reports", distinct=True),
            total_size=Sum("datasets__size", distinct=True)
        )


class ProjectSizeDetailView(ListAPIView):
    """
    List all datasets belonging to a given project,
    with information about size and number of rulesets and reports.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['projects']

        def get_response_serializer(self, path, method):
            return DatasetSizeSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="project_size_detail")
    serializer_class = DatasetSizeSerializer
    permission_classes = [IsRolapUser & OwnerPermission]
    filter_backends = [OrderingFilter]
    ordering = ("name", )

    def get_object(self):
        try:
            project = get_object_or_404(Project, id=self.kwargs["id"])
        except (PermissionDenied, Http404):
            raise ProjectNotFoundException()
        self.check_object_permissions(self.request, project)
        return project

    def get_queryset(self):
        project = self.get_object()
        limits = UserLimits(self.request.user)
        condition = When(
            Q(size__gt=limits.max_size) |
            Q(number_of_columns__gt=limits.max_columns) |
            Q(number_of_rows__gt=limits.max_rows),
            then=False
        )
        queryset = project.datasets.annotate(
            is_active=Case(condition, default=True,
                           output_field=BooleanField()),
        )
        return queryset.all()
