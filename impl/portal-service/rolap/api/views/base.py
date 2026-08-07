from django.conf import settings
from django.http import Http404
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import GenericAPIView
from rolap.api.exceptions import DatasetMaxColumnsViolation
from rolap.api.exceptions import DatasetMaxRowsViolation
from rolap.api.exceptions import DatasetMaxSizeViolation
from rolap.api.exceptions import DatasetNotFoundException
from rolap.api.exceptions import MaxNumberOfDatasetsViolation
from rolap.api.exceptions import MaxNumberOfProjectsViolation
from rolap.api.exceptions import MaxNumberOfReportsViolation
from rolap.api.exceptions import MaxNumberOfRulesetsViolation
from rolap.api.exceptions import ProjectNotFoundException
from rolap.api.exceptions import ReportNotFoundException
from rolap.api.exceptions import RulesetNotFoundException
from rolap.api.exceptions import TaskNotFoundException
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.models import Report
from rolap.api.models import Ruleset
from rolap.api.models import Task
from rolap.api.models import TaskType
from rolap.api.permissions import IsRolapUser
from rolap.api.permissions import OwnerPermission
from rolap.api.utils.limits import UserLimits


class UserLimitsMixin:
    """
    Mixin to check user limits for creating new objects.
    This design limits the database query for the user limit to one per request.
    Different methods can be used in different views as needed.
    """
    _limits = None

    @property
    def limits(self):
        # cached property
        if self._limits is None:
            self._limits = UserLimits(self.request.user)
        return self._limits

    def check_dataset_compliance(self, dataset: Dataset):
        # deleting an object related to a dataset is always allowed
        if self.request.method == "DELETE":
            return
        # worker role is allowed to do anything
        if settings.KEYCLOAK_WORKER_ROLE in self.request.user._permissions:
            return
        # check compliance
        if self.limits.max_size < dataset.size:
            raise DatasetMaxSizeViolation(self.limits.max_size, dataset.size)
        if self.limits.max_columns < dataset.number_of_columns:
            raise DatasetMaxColumnsViolation(
                self.limits.max_columns, dataset.number_of_columns)
        if self.limits.max_rows < dataset.number_of_rows:
            raise DatasetMaxRowsViolation(
                self.limits.max_rows, dataset.number_of_rows)

    def can_create_project(self):
        number_of_projects = self.limits.user.projects.count()
        if self.limits.max_projects <= number_of_projects:
            raise MaxNumberOfProjectsViolation(self.limits.max_projects)

    def can_create_dataset(self, project: Project):
        number_of_datasets = project.dataset_count
        if self.limits.max_datasets <= number_of_datasets:
            raise MaxNumberOfDatasetsViolation(self.limits.max_datasets)

    def can_split_dataset(self, project: Project):
        number_of_datasets = project.dataset_count
        if self.limits.max_datasets - 1 <= number_of_datasets:
            raise MaxNumberOfDatasetsViolation(self.limits.max_datasets)

    def can_create_ruleset(self, dataset: Dataset):
        existing_rulesets = dataset.ruleset_count
        rulesets_in_progress = dataset.child_tasks.filter(
            type__in=[TaskType.LEARNING,
                      TaskType.FILTER_RULESET, TaskType.SAVE_RULESET],
            status__in=[Task.TaskStatus.STARTED, Task.TaskStatus.PENDING]).count()
        total_ruleset_count = existing_rulesets + rulesets_in_progress
        if self.limits.max_rulesets <= total_ruleset_count:
            raise MaxNumberOfRulesetsViolation(self.limits.max_rulesets)

    def can_create_report(self, dataset: Dataset):
        existing_reports = dataset.report_count
        reports_in_progress = dataset.child_tasks.filter(
            type=TaskType.REPORT, status__in=[Task.TaskStatus.STARTED, Task.TaskStatus.PENDING]).count()
        total_report_count = existing_reports + reports_in_progress
        if self.limits.max_reports <= total_report_count:
            raise MaxNumberOfReportsViolation(self.limits.max_reports)


class DatasetBaseView(UserLimitsMixin, GenericAPIView):
    permission_classes = [IsRolapUser & OwnerPermission]
    queryset = Dataset.objects.all()
    lookup_url_kwarg = "dataset_id"

    def get_object(self):
        try:
            dataset = super().get_object()
        except Http404:
            raise DatasetNotFoundException()
        self.check_dataset_compliance(dataset)
        return dataset


class RulesetBaseView(UserLimitsMixin, GenericAPIView):
    permission_classes = [IsRolapUser & OwnerPermission]
    queryset = Ruleset.objects.all()
    lookup_url_kwarg = "ruleset_id"

    def get_object(self):
        try:
            ruleset = super().get_object()
        except Http404:
            raise RulesetNotFoundException()
        self.check_dataset_compliance(ruleset.attached_to_dataset)
        return ruleset


class ProjectBaseView(GenericAPIView):
    permission_classes = [IsRolapUser & OwnerPermission]
    queryset = Project.objects.all()
    lookup_url_kwarg = "id"

    def get_object(self):
        try:
            return super().get_object()
        except (PermissionDenied, Http404):
            raise ProjectNotFoundException()


class ReportBaseView(UserLimitsMixin, GenericAPIView):
    permission_classes = [IsRolapUser & OwnerPermission]
    queryset = Report.objects.all()
    lookup_url_kwarg = "report_id"

    def get_object(self):
        try:
            report = super().get_object()
        except Http404:
            raise ReportNotFoundException()
        self.check_dataset_compliance(report.content_object)
        return report


class TaskBaseView(GenericAPIView):
    permission_classes = [IsRolapUser & OwnerPermission]
    queryset = Task.objects.all()
    lookup_url_kwarg = "task_id"

    def get_object(self):
        try:
            return super().get_object()
        except Http404:
            raise TaskNotFoundException()
