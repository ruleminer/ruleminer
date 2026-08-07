import pandas as pd
from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.projects import Project


class DatasetDetailViewTest(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project: Project = Project.objects.create(
            name='Test Project', description='This is a test project.', type_of_problem='classification', owner=self.user
        )
        self.dataset: Dataset = Dataset.objects.create(
            name='Test dataset 1', delimiter=',', project=self.project, path='550e8400-e29b-41d4-a716-446655440000', description='Default description')
        df = pd.DataFrame(
            {
                "name": ["A", "B", "C", "D", "E"],
                "age": [1, 2, 3, 4, 5]
            }
        )
        self.dataset.write_dataset_to_storage(df)

    def test_get_dataset_detail(self):
        url = reverse('dataset_detail', kwargs={'dataset_id': self.dataset.id})
        self.client.force_authenticate(self.user)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data['description'], self.dataset.description)

    def test_get_dataset_detail_forbidden(self):
        url = reverse('dataset_detail', kwargs={'dataset_id': self.dataset.id})
        self.user._permissions = []
        self.client.force_authenticate(self.user)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_dataset_detail_wrong_user(self):
        url = reverse('dataset_detail', kwargs={'dataset_id': self.dataset.id})
        another_user: User = User.objects.create_user(
            keycloak_id='2', username='another_user', email='testuser2@test.com', password='testpass'
        )
        another_user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.client.force_authenticate(another_user)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_dataset_detail(self):
        url = reverse('dataset_detail', kwargs={'dataset_id': self.dataset.id})
        self.client.force_authenticate(self.user)

        updated_data = {'description': 'Updated dataset description'}
        response = self.client.patch(url, data=updated_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.dataset.refresh_from_db()
        self.assertEqual(self.dataset.description, updated_data['description'])

    def test_update_nonexistent_dataset(self):
        url = reverse('dataset_detail', kwargs={'dataset_id': 9999})
        self.client.force_authenticate(self.user)

        updated_data = {'description': 'Updated dataset description'}
        response = self.client.patch(url, data=updated_data)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_dataset_with_none_description(self):
        dataset_with_none = Dataset.objects.create(
            name='Dataset with None description', delimiter=',', project=self.project, path='550e8400-e29b-41d4-a716-446655440001', description=None)
        url = reverse('dataset_detail', kwargs={
                      'dataset_id': dataset_with_none.id})
        self.client.force_authenticate(self.user)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['description'])

    def test_update_dataset_to_none_description(self):
        url = reverse('dataset_detail', kwargs={'dataset_id': self.dataset.id})
        self.client.force_authenticate(self.user)
        updated_data = {'description': None}
        response = self.client.patch(url, data=updated_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.dataset.refresh_from_db()
        self.assertIsNone(self.dataset.description)

    def test_update_dataset_detail_forbidden(self):
        url = reverse('dataset_detail', kwargs={'dataset_id': self.dataset.id})
        self.user._permissions = []
        self.client.force_authenticate(self.user)

        updated_data = {'description': 'Updated dataset description'}
        response = self.client.patch(url, data=updated_data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_successful(self):
        delete_url = reverse("dataset_detail", kwargs={
                             "dataset_id": self.dataset.pk})
        self.client.force_authenticate(self.user)
        response = self.client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Dataset.objects.filter(pk=self.dataset.pk).exists())
        self.assertFalse(DatasetAttributes.objects.filter(
            dataset=self.dataset).exists())

    def test_delete_nonexistent_dataset(self):
        delete_url = reverse("dataset_detail", kwargs={"dataset_id": 999})
        self.client.force_authenticate(self.user)

        response = self.client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthorized(self):
        delete_url = reverse("dataset_detail", kwargs={
                             "dataset_id": self.dataset.pk})
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_forbidden(self):
        delete_url = reverse("dataset_detail", kwargs={
                             "dataset_id": self.dataset.pk})
        self.user._permissions = []
        self.client.force_authenticate(self.user)
        response = self.client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
