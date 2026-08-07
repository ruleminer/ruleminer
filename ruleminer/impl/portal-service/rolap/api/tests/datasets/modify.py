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


class DatasetModifyTestCase(TestCase):
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
                "name": ["A", "B", "C", "D", "E"],
                "age": [1, 2, 3, 4, 5]
            }
        )
        self.dataset.write_dataset_to_storage(df)
        self.attribute1 = DatasetAttributes.objects.create(
            name="name", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.CATEGORICAL, role=DatasetAttributes.DataAttributeRoles.CLASSIFICATION, unique_values=[
                "A", "B", "C", "D", "E"],
        )
        self.attribute2 = DatasetAttributes.objects.create(
            name="age", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE, min=1, max=5, average=3,
        )

    def test_modify_filter_age(self):
        modify_url = reverse("modify_dataset", kwargs={
            "dataset_id": self.dataset.pk})
        query = {"limit": 10, "offset": 0, "age__ge": 3}
        modify_url = f"{modify_url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        modify_response = self.client.post(
            modify_url,
            {
                "columns": ["name", "age"],
                "name": "New test dataset",
            }
        )
        self.assertEqual(modify_response.status_code, status.HTTP_201_CREATED)
        new_dataset_id = json.loads(modify_response.content)["dataset_id"]
        check_url = reverse("preview_dataset", kwargs={
            "dataset_id": new_dataset_id})
        check_url = f"{check_url}?{urlencode(query)}"
        check_response = self.client.post(
            check_url,
            {
                "columns": ["name", "age"],
            }
        )
        content = json.loads(check_response.content)
        self.assertEqual(check_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(content["records"]), 3)
        self.assertEqual(content["count"], 3)

    def test_modify_wrong_operator(self):
        modify_url = reverse("modify_dataset", kwargs={
            "dataset_id": self.dataset.pk})
        query = {"limit": 10, "offset": 0, "age__xd": 3}
        modify_url = f"{modify_url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        modify_response = self.client.post(
            modify_url,
            {
                "columns": ["name", "age"],
                "name": "New test dataset",
            }
        )
        self.assertEqual(modify_response.status_code,
                         status.HTTP_400_BAD_REQUEST)

    def test_modify_unauthorized(self):
        url = reverse("modify_dataset", kwargs={
                      "dataset_id": self.dataset.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_modify_forbidden(self):
        modify_url = reverse("modify_dataset", kwargs={
            "dataset_id": self.dataset.pk})
        query = {"limit": 10, "offset": 0, "age__ge": 3}
        modify_url = f"{modify_url}?{urlencode(query)}"
        self.user._permissions = []
        self.client.force_authenticate(self.user)
        modify_response = self.client.post(
            modify_url,
            {
                "columns": ["name", "age"],
                "name": "New test dataset",
            }
        )
        self.assertEqual(modify_response.status_code,
                         status.HTTP_403_FORBIDDEN)
