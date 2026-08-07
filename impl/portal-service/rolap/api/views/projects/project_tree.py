from django.db.models import BooleanField
from django.db.models import Case
from django.db.models import Count
from django.db.models import Q
from django.db.models import When
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Project
from rolap.api.serializers.projects import DatasetTreeSerializer
from rolap.api.serializers.projects import ProjectTreeSerializer
from rolap.api.utils.limits import UserLimits
from rolap.api.views.base import ProjectBaseView


class ProjectTreeView(ProjectBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['projects']

        def get_response_serializer(self, path, method):
            return ProjectTreeSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="project_tree")
    serializer_class = ProjectTreeSerializer

    def get(self, *args, **kwargs):
        """Retrieve the tree of datasets and their associated objects for a given project.

        Args:
            id (int): ID of the project to retrieve datasets for.

        Returns:
            Response: object containing serialized tree with datasets, rulesets and reports
        """
        project: Project = self.get_object()
        project.last_opened_at = timezone.now()
        project.save()

        # initialize response serializer
        serializer = ProjectTreeSerializer(project)
        return_data = serializer.data

        annotated_datasets = self._annotate_datasets(project)

        # update response serializer with annotated datasets
        return_data["items"] = DatasetTreeSerializer(
            annotated_datasets, many=True).data

        return Response(return_data, status=status.HTTP_200_OK)

    def _annotate_datasets(self, project: Project):
        # annotate datasets as:
        # 1. active or not based on their compliance with current user limits
        # 2. whether they have reached their limit of rulesets
        # 3. whether they have reached their limit of reports
        limits = UserLimits(self.request.user)
        active_condition = When(
            Q(size__gt=limits.max_size) |
            Q(number_of_columns__gt=limits.max_columns) |
            Q(number_of_rows__gt=limits.max_rows),
            then=False
        )
        ruleset_condition = When(
            Q(ruleset_number__gte=limits.max_rulesets),
            then=True
        )
        report_condition = When(
            Q(report_number__gte=limits.max_reports),
            then=True
        )
        # note: we have to "pre-annotate" the number of rulesets and reports,
        # because DB look-up does not work with properties `ruleset_count` and `report_count`
        # defined in the `Dataset` model
        annotated_datasets = project.datasets.annotate(
            ruleset_number=Count("attached_rulesets", distinct=True),
            report_number=Count("reports", distinct=True),
            is_active=Case(active_condition, default=True,
                           output_field=BooleanField()),
            ruleset_limit_reached=Case(ruleset_condition, default=False,
                                       output_field=BooleanField()),
            report_limit_reached=Case(report_condition, default=False,
                                      output_field=BooleanField()),
        )

        return annotated_datasets
