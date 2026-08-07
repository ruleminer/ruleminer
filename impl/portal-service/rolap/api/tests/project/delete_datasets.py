import pandas as pd
from django.conf import settings
from django.urls import reverse
from django.utils.http import urlencode
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models import Dataset
from rolap.api.models import Project


class DeleteMultipleDatasetsViewTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            keycloak_id=1, username="test", email="test@test.com", password="test",
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project = Project.objects.create(name="test", owner=self.user)
        df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
        self.dataset1 = Dataset.objects.create(
            name="test dataset 1", project=self.project)
        self.dataset1.write_dataset_to_storage(df)
        self.dataset2 = Dataset.objects.create(
            name="test dataset 2", project=self.project)
        self.dataset2.write_dataset_to_storage(df)
        self.dataset3 = Dataset.objects.create(
            name="test dataset 3", project=self.project)
        self.dataset3.write_dataset_to_storage(df)

    def test_delete_multiple_datasets(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("project-delete-multiple-datasets",
                      kwargs={"id": self.project.id})
        query = {"datasets": f"{self.dataset1.pk},{self.dataset2.pk}"}
        url = f"{url}?{urlencode(query)}"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.project.datasets.count(), 1)
        self.assertEqual(self.project.datasets.first(), self.dataset3)

    def test_delete_multiple_datasets_wrong(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("project-delete-multiple-datasets",
                      kwargs={"id": self.project.id})
        query = {"datasets": f"{self.dataset1.pk},{self.dataset2.pk},999"}
        url = f"{url}?{urlencode(query)}"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.project.datasets.count(), 3)

    def test_delete_multiple_datasets_forbidden(self):
        user = User.objects.create_user(
            keycloak_id=2, username="test2", email="test2@test.com", password="test",
        )
        user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.client.force_authenticate(user=user)
        url = reverse("project-delete-multiple-datasets",
                      kwargs={"id": self.project.id})
        query = {"datasets": f"{self.dataset1.pk},{self.dataset2.pk}"}
        url = f"{url}?{urlencode(query)}"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.project.datasets.count(), 3)
