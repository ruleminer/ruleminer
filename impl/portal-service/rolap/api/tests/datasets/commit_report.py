import os

from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.models import Report
from rolap.api.models import Task
from rolap.api.models import TaskType


class DatasetCommitReportTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = ["celery_worker"]
        self.project: Project = Project.objects.create(
            name='Test Project', description='This is a test project.',
            type_of_problem='classification', owner=self.user,
        )
        self.dataset: Dataset = Dataset.objects.create(
            name='Test dataset 1', project=self.project)
        self.db_storage_path = os.path.join(
            "reports", "eda", str(self.dataset.pk), "report.html")
        self.task = Task.objects.create(
            status=Task.TaskStatus.SUCCESS,
            project=self.project,
            type=TaskType.REPORT,
            meta={},
        )
        self.task.source_object = self.dataset
        self.task.save()
        self.body_data = {
            "title": "Test report",
            "storage_path": self.db_storage_path,
            "type": Report.ReportType.EDA,
            "generation_params": {},
            "celery_task": self.task.pk,
        }

    def test_commit_report(self):
        url = reverse("commit_report", kwargs={
            "dataset_id": self.dataset.pk})
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            url, data=self.body_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.dataset.reports.last().storage_path,
                         self.db_storage_path)
        self.assertEqual(self.dataset.reports.last().type,
                         Report.ReportType.EDA)
        self.task.refresh_from_db()
        self.assertEqual(self.task.result_object.pk,
                         self.dataset.reports.last().pk)
        self.assertEqual(self.dataset.reports.last().generation_params, {})

    def test_commit_report_forbidden(self):
        url = reverse("commit_report", kwargs={
            "dataset_id": self.dataset.pk})
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            url, data=self.body_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
