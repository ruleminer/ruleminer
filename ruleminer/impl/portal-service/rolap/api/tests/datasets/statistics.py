from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.projects import Project


class StatisticsViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='user_keycloak_id_1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.user2: User = User.objects.create_user(
            keycloak_id='user_keycloak_id_2',  username='testuser2', email='testuser2@test.com', password='testpass2'
        )
        self.user2._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project: Project = Project.objects.create(
            name='Test Project', description='This is a test project.',
            type_of_problem='classification', owner=self.user,
        )
        self.dataset: Dataset = Dataset.objects.create(
            name='Test dataset 1', project=self.project, number_of_rows=100, number_of_columns=2
        )

        self.attribute1: DatasetAttributes = DatasetAttributes.objects.create(
            name='attr1', type='int', role='attr', dataset=self.dataset,
            min=10, max=100, average=50, missing_values_count=5, mode='10'
        )

        self.attribute2: DatasetAttributes = DatasetAttributes.objects.create(
            name='attr2', type='float', role='class', dataset=self.dataset,
            min=1.5, max=9.5, average=5.0, missing_values_count=2, mode='3.0'
        )

    def test_statistics_view(self):
        url = reverse("statistics", args=[self.dataset.id])
        self.client.force_authenticate(self.user)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsInstance(data, dict)
        self.assertIn("headers", data)
        self.assertIn("columns", data)
        columns = data["columns"]
        self.assertIsInstance(columns, list)
        self.assertEqual(len(columns), 2)
        column1 = columns[0]
        self.assertEqual(column1["column_name"], "attr1")
        statistics1 = column1["statistics"][0]
        self.assertEqual(statistics1["name"], "mean")
        self.assertEqual(statistics1["value"], "50.0")
        statistics5 = column1["statistics"][4]
        self.assertEqual(statistics5["name"], "mode")
        self.assertEqual(statistics5["value"], "10")
        column2 = columns[1]
        self.assertEqual(column2["column_name"], "attr2")
        statistics1 = column2["statistics"][0]
        self.assertEqual(statistics1["name"], "mean")
        self.assertEqual(statistics1["value"], "5.0")
        statistics2 = column2["statistics"][1]
        self.assertEqual(statistics2["name"], "max")
        self.assertEqual(statistics2["value"], "9.5")
        statistics3 = column2["statistics"][2]
        self.assertEqual(statistics3["name"], "min")
        self.assertEqual(statistics3["value"], "1.5")
        statistics4 = column2["statistics"][3]
        self.assertEqual(statistics4["name"], "missing_values_count")
        self.assertEqual(statistics4["value"], "2")
        self.assertIn("summary", data)
        summary = data["summary"]
        self.assertIsInstance(summary, dict)
        self.assertEqual(summary["number_of_rows"], 100)
        self.assertEqual(summary["number_of_columns"], 2)

    def test_statistics_view_invalid_dataset_id(self):
        url = reverse("statistics", args=[999])
        self.client.force_authenticate(self.user)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_statistics_view_no_permissions(self):
        url = reverse("statistics", args=[self.dataset.id])
        self.client.force_authenticate(self.user2)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DatasetSummaryViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='user_keycloak_id_1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.user2: User = User.objects.create_user(
            keycloak_id='user_keycloak_id_2',  username='testuser2', email='testuser2@test.com', password='testpass2'
        )
        self.user2._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project: Project = Project.objects.create(
            name='Test Project', description='This is a test project.',
            type_of_problem='classification', owner=self.user,
        )
        self.dataset = Dataset.objects.create(
            name='Test dataset', project=self.project,
            number_of_rows=100, number_of_columns=2
        )

    def test_dataset_summary_view(self):
        url = reverse("dataset_summary", args=[self.dataset.id])
        self.client.force_authenticate(self.user)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["number_of_rows"], 100)
        self.assertEqual(data["number_of_columns"], 2)

    def test_dataset_summary_view_invalid_dataset_id(self):
        url = reverse("dataset_summary", args=[999])
        self.client.force_authenticate(self.user)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_dataset_summary_view_no_permissions(self):
        url = reverse("dataset_summary", args=[self.dataset.id])
        self.client.force_authenticate(self.user2)
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
