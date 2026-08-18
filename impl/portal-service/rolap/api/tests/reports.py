import os
from unittest.mock import patch

from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.models import Report


class ReportMetadataViewTest(APITestCase):
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

    def test_get_report_metadata(self):
        url = reverse('report_metadata', kwargs={'report_id': self.report.pk})
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["type"], self.metadata["type"])
        self.assertEqual(
            response.data["generation_params"], self.metadata["generation_params"])

    def test_get_report_metadata_forbidden(self):
        url = reverse('report_metadata', kwargs={'report_id': self.report.pk})
        self.user._permissions = []
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("rolap.api.models.reports.paramiko.SSHClient")
    def test_delete_report(self, mock_ssh_client):
        """
        Test deleting a report, mocking the SFTP connection.
        """
        mock_ssh_instance = mock_ssh_client.return_value
        mock_sftp = mock_ssh_instance.open_sftp.return_value
        mock_sftp.remove.return_value = None

        pk = self.report.pk
        url = reverse('report_metadata', kwargs={'report_id': pk})
        self.client.force_authenticate(self.user)

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Report.objects.filter(pk=pk).count(), 0)

        mock_ssh_client.assert_called_once()


class ModifyReportViewTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project = Project.objects.create(
            name='Test Project', description='This is a test project.',
            type_of_problem='classification', owner=self.user,
        )
        self.dataset = Dataset.objects.create(
            name='Test dataset 1', project=self.project)
        self.db_storage_path = os.path.join(
            "reports", "eda", str(self.dataset.pk), "report.html")
        self.metadata = {
            "title": "EDA report",
            "type": Report.ReportType.EDA,
            "storage_path": self.db_storage_path,
            "generation_params": {},
        }
        self.report = Report.objects.create(
            content_object=self.dataset, **self.metadata)

    def test_modify_report_title_success(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('modify_report', kwargs={'report_id': self.report.pk})
        new_title = "Updated EDA report"
        response = self.client.patch(url, {'title': new_title}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.report.refresh_from_db()
        self.assertEqual(self.report.title, new_title)

    def test_modify_report_title_failure_due_to_duplicate(self):
        Report.objects.create(content_object=self.dataset,
                              **{**self.metadata, "title": "Initial report"})

        self.client.force_authenticate(user=self.user)
        url = reverse('modify_report', kwargs={'report_id': self.report.pk})
        response = self.client.patch(
            url, {'title': "Initial report"}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_forbidden_access(self):
        another_user = User.objects.create_user(
            keycloak_id='2', username='otheruser', email='otheruser@test.com', password='testpass'
        )
        self.client.force_authenticate(user=another_user)
        url = reverse('modify_report', kwargs={'report_id': self.report.pk})
        response = self.client.patch(
            url, {'title': "Forbidden attempt"}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
