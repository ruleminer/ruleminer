import json

import pandas as pd
from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from django.utils.http import urlencode
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.projects import Project


class DatasetPreviewTestCase(TestCase):
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
        df = pd.DataFrame(
            {
                "name": ["B", "A", "C", "D", "E"],
                "age": [4, 3, 2, 1, 5]
            }
        )
        self.dataset.write_dataset_to_storage(df)
        self.attribute1 = DatasetAttributes.objects.create(
            name="name", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.CATEGORICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE, unique_values=[
                "A", "B", "C", "D", "E"],
        )
        self.attribute2 = DatasetAttributes.objects.create(
            name="age", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE, min=1, max=5, average=3,
        )

    def test_preview_filter_age(self):
        url = reverse("preview_dataset", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 2, "offset": 0, "age__ge": 3}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        response = self.client.post(url, {"columns": ["age"]})
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(content["records"]), 2)
        self.assertEqual(content["count"], 3)

    def test_preview_filter_name(self):
        url = reverse("preview_dataset", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 10, "offset": 0, "name__eq": "A"}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        response = self.client.post(url, {"columns": ["name"]})
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(content["records"]), 1)
        self.assertEqual(content["count"], 1)

    def test_preview_wrong_filter_operator(self):
        url = reverse("preview_dataset", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 10, "offset": 0, "age__xd": 3}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        response = self.client.post(url, {"columns": ["age"]})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_preview_wrong_body(self):
        url = reverse("preview_dataset", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 10, "offset": 0, "age__ge": 3}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_preview_unauthorized(self):
        url = reverse("preview_dataset", kwargs={
                      "dataset_id": self.dataset.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_preview_forbidden(self):
        url = reverse("preview_dataset", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 2, "offset": 0, "age__ge": 3}
        url = f"{url}?{urlencode(query)}"
        self.user._permissions = []
        self.client.force_authenticate(self.user)
        response = self.client.post(url, {"columns": ["age"]})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_preview_sort_ascending(self):
        url = reverse("preview_dataset", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 5, "offset": 0}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        response = self.client.post(url, {
            "columns": ["name", "age"],
            "sort": [{"selector": "age", "desc": False}]
        }, format='json')
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ages = [record["column_values"][1] for record in content["records"]]
        self.assertEqual(ages, sorted(ages))

    def test_preview_sort_descending(self):
        url = reverse("preview_dataset", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 5, "offset": 0}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        response = self.client.post(url, {
            "columns": ["name", "age"],
            "sort": [{"selector": "age", "desc": True}]
        }, format='json')
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ages = [record["column_values"][1] for record in content["records"]]
        self.assertEqual(ages, sorted(ages, reverse=True))

    def test_preview_sort_multiple_columns(self):
        url = reverse("preview_dataset", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 5, "offset": 0}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        response = self.client.post(url, {
            "columns": ["name", "age"],
            "sort": [
                {"selector": "name", "desc": False},
                {"selector": "age", "desc": True}
            ]
        }, format='json')
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [record["column_values"][0] for record in content["records"]]
        self.assertEqual(names, sorted(names))
