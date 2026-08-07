from django.conf import settings
from django.urls import reverse
from django.utils.http import urlencode
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.models import Report
from rolap.api.models import Ruleset


class ProjectSizeViewsTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project1 = Project.objects.create(
            name='Test Project',
            description='Test description',
            type_of_problem=Project.CLASSIFICATION,
            owner=self.user
        )
        self.dataset11 = Dataset.objects.create(
            project=self.project1,
            name='Dataset1',
            size=100,
            number_of_rows=100,
            number_of_columns=10,
        )
        self.dataset12 = Dataset.objects.create(
            project=self.project1,
            name='Dataset2',
            size=200,
            number_of_rows=200,
            number_of_columns=20,
        )
        self.project2 = Project.objects.create(
            name='Test Project 2',
            description='Test description 2',
            type_of_problem=Project.REGRESSION,
            owner=self.user
        )
        self.dataset21 = Dataset.objects.create(
            project=self.project2,
            name='Dataset1',
            size=300,
            number_of_rows=300,
            number_of_columns=30,
        )
        self.dataset22 = Dataset.objects.create(
            project=self.project2,
            name='Dataset2',
            size=400,
            number_of_rows=400,
            number_of_columns=40,
        )
        self.report11 = self.dataset11.reports.create(
            title='Report 1',
            type=Report.ReportType.EDA,
            storage_path='report1.html',
        )
        self.report12 = self.dataset12.reports.create(
            title='Report 2',
            type=Report.ReportType.PREDICTION,
            storage_path='report2.html',
        )
        self.ruleset21 = Ruleset.objects.create(
            name='Ruleset 1',
            attached_to_dataset=self.dataset21,
        )

    def test_project_size_list(self):
        url = reverse('project-size-list')
        query = {'ordering': 'total_size'}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["name"], self.project1.name)
        self.assertEqual(results[0]["total_size"], 300)
        self.assertEqual(results[1]["name"], self.project2.name)
        self.assertEqual(results[1]["total_size"], 700)
        self.assertEqual(results[0]["dataset_count"], 2)
        self.assertEqual(results[1]["dataset_count"], 2)
        self.assertEqual(results[0]["ruleset_count"], 0)
        self.assertEqual(results[1]["ruleset_count"], 1)
        self.assertEqual(results[0]["report_count"], 2)
        self.assertEqual(results[1]["report_count"], 0)

    def test_project_size_list_filtered(self):
        url = reverse('project-size-list')
        query = {'type_of_problem': Project.CLASSIFICATION}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        response = self.client.get(
            url, {'type_of_problem': Project.CLASSIFICATION})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], self.project1.name)

    def test_project_size_list_sorted(self):
        url = reverse('project-size-list')
        query = {'ordering': '-total_size'}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["name"], self.project2.name)
        self.assertEqual(results[1]["name"], self.project1.name)

    def test_project_size_list_unauthorized(self):
        url = reverse('project-size-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_project_size_detail(self):
        url = reverse('project-size-detail', args=[self.project1.pk])
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(results[0]["name"], self.dataset11.name)
        self.assertEqual(results[0]["size"], 100)
        self.assertEqual(results[0]["ruleset_count"], 0)
        self.assertEqual(results[0]["report_count"], 1)
        self.assertEqual(results[1]["name"], self.dataset12.name)
        self.assertEqual(results[1]["size"], 200)
        self.assertEqual(results[1]["ruleset_count"], 0)
        self.assertEqual(results[1]["report_count"], 1)

    def test_project_size_detail_not_found(self):
        url = reverse('project-size-detail', args=[100])
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_project_size_detail_permission_denied(self):
        user2 = User.objects.create_user(
            keycloak_id='2', username='testuser2', email='testuser2@test.com', password='testpass',
        )
        user2._permissions = [settings.KEYCLOAK_USER_ROLE]
        url = reverse('project-size-detail', args=[self.project1.pk])
        self.client.force_authenticate(user2)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
