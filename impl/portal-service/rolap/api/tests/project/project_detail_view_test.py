import pandas as pd
from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient
from rolap.api.exceptions import DatasetReadWriteException
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.projects import Project
from rolap.api.serializers.projects import ProjectSerializer


class ProjectDetailViewTestCase(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()

        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project: Project = Project.objects.create(
            name='Test Project', description='This is a test project.', type_of_problem='classification', owner=self.user
        )
        self.dataset: Dataset = Dataset.objects.create(
            name='Test dataset 1', project=self.project)
        df = pd.DataFrame(
            {
                "name": ["A", "B", "C", "D", "E"],
                "age": [1, 2, 3, 4, 5]
            }
        )
        self.dataset.write_dataset_to_storage(df)
        self.attribute1 = DatasetAttributes.objects.create(
            name="name", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.CATEGORICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE
        )
        self.attribute2 = DatasetAttributes.objects.create(
            name="age", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE, min=1, max=5, average=3,
        )

    def test_get_project_detail(self):
        url: str = reverse(
            'project-detail', kwargs={'id': self.project.id})
        self.client.force_authenticate(self.user)
        response: Response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, ProjectSerializer(self.project).data)

    def test_get_project_detail_unauthorized(self):
        url: str = reverse(
            'project-detail', kwargs={'id': self.project.id})
        unauthorized_user: User = User.objects.create_user(
            keycloak_id='2', username='unauthorized', email='unauthorized@test.com', password='testpass'
        )
        unauthorized_user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.client.force_authenticate(unauthorized_user)
        response: Response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'],
                         'Project not found')

    def test_update_project_detail(self):
        data: dict = {'name': 'New Project Name'}
        url: str = reverse(
            'project-detail', kwargs={'id': self.project.id})
        self.client.force_authenticate(self.user)
        response: Response = self.client.patch(url, data=data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.name, data['name'])
        self.assertEqual(self.project.description, 'This is a test project.')

    def test_delete_project_detail(self):
        url: str = reverse(
            'project-detail', kwargs={'id': self.project.id})
        self.client.force_authenticate(self.user)
        response: Response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(pk=self.project.id).exists())
        self.assertFalse(Dataset.objects.filter(project=self.project).exists())
        self.assertFalse(DatasetAttributes.objects.filter(
            dataset=self.dataset).exists())
        with self.assertRaises(DatasetReadWriteException):
            self.dataset.read_dataset_from_storage()

    def test_delete_nonexistent_project(self):
        delete_url = reverse("project-detail", kwargs={"id": 999})
        self.client.force_authenticate(self.user)

        response = self.client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_project_detail_forbidden(self):
        url: str = reverse(
            'project-detail', kwargs={'id': self.project.id})
        self.user._permissions = []
        self.client.force_authenticate(self.user)
        response: Response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
