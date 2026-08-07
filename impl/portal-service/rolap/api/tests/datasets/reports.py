import os

from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.models import Report


class DatasetReportsTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project: Project = Project.objects.create(
            name='Test Project', description='This is a test project.',
            type_of_problem='classification', owner=self.user,
        )
        self.dataset: Dataset = Dataset.objects.create(
            name='Test dataset 1', project=self.project)
        self.db_storage_path = os.path.join(
            "reports", "eda", str(self.dataset.pk), "report.html")
        self.metadata = {
            "title": "EDA report",
            "type": Report.ReportType.EDA,
            "storage_path": self.db_storage_path,
            "generation_params": {},
        }
        self.report: Report = self.dataset.reports.create(**self.metadata)

    def test_get_reports(self):
        url = reverse('dataset_report_list', kwargs={
                      'dataset_id': self.dataset.pk})
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data["reports"]
                         [0]["type"], self.metadata["type"])
        self.assertEqual(
            response.data["reports"][0]["generation_params"], self.metadata["generation_params"])

    def test_get_reports_forbidden(self):
        url = reverse('dataset_report_list', kwargs={
                      'dataset_id': self.dataset.pk})
        self.user._permissions = []
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
