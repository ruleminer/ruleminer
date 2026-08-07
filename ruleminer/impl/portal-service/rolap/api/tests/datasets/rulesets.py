import json
import os

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


def get_file_path(filename: str) -> str:
    dir_path: str = os.path.dirname(os.path.realpath(__file__))
    return os.path.join(dir_path, "test_data", filename)


class BaseSetup(TestCase):
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
        self.df = pd.read_csv(get_file_path("iris.csv")).sample(frac=1)
        self.dataset.write_dataset_to_storage(self.df)
        self.attribute1 = DatasetAttributes.objects.create(
            name="sepallength", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE
        )
        self.attribute2 = DatasetAttributes.objects.create(
            name="sepalwidth", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE
        )
        self.attribute3 = DatasetAttributes.objects.create(
            name="petallength", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE
        )
        self.attribute4 = DatasetAttributes.objects.create(
            name="petalwidth", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE
        )
        self.attribute5 = DatasetAttributes.objects.create(
            name="target", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.CATEGORICAL, role=DatasetAttributes.DataAttributeRoles.CLASSIFICATION, unique_values=[
                0, 1, 2],
        )
        with open(get_file_path("rules.json")) as file:
            self.ruleset = json.load(file)


class DatasetRulesetFilterTestCase(BaseSetup):
    def test_filter_dataset(self):
        url = reverse("filter_dataset_by_rules", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 150, "offset": 0}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        response = self.client.post(url, {"ruleset": json.dumps(self.ruleset)})
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(content["count"], 144)

    def test_filter_unique(self):
        url = reverse("filter_dataset_by_rules", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 150, "offset": 0, "operator": "or"}
        cond_rule1 = self.df["petalwidth"] >= 1.65
        cond_rule2 = self.df["petallength"] < 2.35
        cond_rule3 = (self.df["petallength"] < 4.95) & (
            self.df["sepallength"] >= 4.95) & (self.df["petalwidth"] < 1.75)
        unique = [
            {
                "ids": self.df[cond_rule1 & ~cond_rule2 & ~cond_rule3].index.tolist()
            },
            {
                "ids": self.df[~cond_rule1 & cond_rule2 & ~cond_rule3].index.tolist()
            },
            {
                "ids": self.df[~cond_rule1 & ~cond_rule2 & cond_rule3].index.tolist()
            }
        ]
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        response = self.client.post(url, {"ruleset": json.dumps(
            self.ruleset), "unique": json.dumps(unique)})
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(content["count"], 114)

    def test_filter_dataset_wrong_rule(self):
        url = reverse("filter_dataset_by_rules", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 150, "offset": 0}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        self.ruleset["rules"][0]["premise"]["operator"] = "WRONG"
        response = self.client.post(url, {"ruleset": json.dumps(self.ruleset)})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_dataset_invalid_rule(self):
        url = reverse("filter_dataset_by_rules", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 150, "offset": 0}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        self.ruleset["rules"][0]["premise"]["subconditions"][0]["negated"] = "WRONG"
        response = self.client.post(url, {"ruleset": json.dumps(self.ruleset)})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_unauthorized(self):
        url = reverse("filter_dataset_by_rules", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 150, "offset": 0}
        url = f"{url}?{urlencode(query)}"
        response = self.client.post(url, {"ruleset": json.dumps(self.ruleset)})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_filter_forbidden(self):
        self.user._permissions = []
        self.client.force_authenticate(self.user)
        url = reverse("filter_dataset_by_rules", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 150, "offset": 0}
        url = f"{url}?{urlencode(query)}"
        response = self.client.post(url, {"ruleset": json.dumps(self.ruleset)})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DatasetRulesetModifyTestCase(BaseSetup):
    def test_modify_dataset(self):
        url = reverse("modify_dataset_by_rules", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 150, "offset": 0}
        url = f"{url}?{urlencode(query)}"
        self.client.force_authenticate(self.user)
        modify_response = self.client.post(
            url,
            {"ruleset": json.dumps(self.ruleset), "name": "New test dataset"}
        )
        self.assertEqual(modify_response.status_code, status.HTTP_201_CREATED)
        new_dataset_id = json.loads(modify_response.content)["dataset_id"]
        check_url = reverse("preview_dataset", kwargs={
            "dataset_id": new_dataset_id})
        check_url = f"{check_url}?{urlencode(query)}"
        check_response = self.client.post(
            check_url,
            {
                "columns": ["sepallength", "sepalwidth", "petallength", "petalwidth", "target"],
            }
        )
        content = json.loads(check_response.content)
        self.assertEqual(check_response.status_code, status.HTTP_200_OK)
        self.assertEqual(content["count"], 144)

    def test_modify_unauthorized(self):
        url = reverse("modify_dataset_by_rules", kwargs={
                      "dataset_id": self.dataset.pk})
        query = {"limit": 150, "offset": 0}
        url = f"{url}?{urlencode(query)}"
        response = self.client.post(
            url,
            {"ruleset": json.dumps(self.ruleset), "name": "New test dataset"}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
