import json

import pandas as pd
from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.projects import Project
from rolap.api.tests.datasets.rulesets import BaseSetup
from rolap.api.tests.datasets.rulesets import get_file_path


class ConditionCoverageTestCase(BaseSetup):
    def setUp(self):
        super().setUp()
        with open(get_file_path("conditions.json")) as file:
            self.cls_conditions = json.load(file)
        self.project2: Project = Project.objects.create(
            name='Test Project 2', description='This is another test project.',
            type_of_problem='regression', owner=self.user,
        )
        self.dataset2: Dataset = Dataset.objects.create(
            name='Test dataset 2', project=self.project2)
        self.df2 = pd.read_csv(get_file_path("random.csv"))
        self.dataset2.write_dataset_to_storage(self.df2)
        self.attribute21 = DatasetAttributes.objects.create(
            name="A", dataset=self.dataset2, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE
        )
        self.attribute22 = DatasetAttributes.objects.create(
            name="B", dataset=self.dataset2, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE
        )
        self.attribute23 = DatasetAttributes.objects.create(
            name="C", dataset=self.dataset2, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL, role=DatasetAttributes.DataAttributeRoles.CLASSIFICATION
        )
        with open(get_file_path("conditions.json")) as file:
            self.conditions1 = json.load(file)
        with open(get_file_path("random_conditions.json")) as file:
            self.conditions2 = json.load(file)

    def test_condition_coverage(self):
        url = reverse("dataset_condition_coverage", kwargs={
                      "dataset_id": self.dataset.pk})
        self.client.force_authenticate(self.user)
        response = self.client.post(url, self.conditions1, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_condition_coverage_unauthorized(self):
        url = reverse("dataset_condition_coverage", kwargs={
                      "dataset_id": self.dataset.pk})
        response = self.client.post(url, self.conditions1, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_condition_coverage_forbidden(self):
        url = reverse("dataset_condition_coverage", kwargs={
                      "dataset_id": self.dataset.pk})
        self.user._permissions = []
        self.client.force_authenticate(self.user)
        response = self.client.post(url, self.conditions1, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_condition_coverage_regression(self):
        url = reverse("dataset_condition_coverage", kwargs={
                      "dataset_id": self.dataset2.pk})
        self.client.force_authenticate(self.user)
        response = self.client.post(url, self.conditions2, format="json")
        data = response.data
        expected_data = [
            {
                "covered_y_mean": self.df2[self.df2["A"] >= 40]["C"].mean().round(settings.ROUND_DECIMAL_PLACES),
                "covered_y_std": self.df2[self.df2["A"] >= 40]["C"].std(ddof=0).round(settings.ROUND_DECIMAL_PLACES),
                "covered_y_min": self.df2[self.df2["A"] >= 40]["C"].min().round(settings.ROUND_DECIMAL_PLACES),
                "covered_y_max": self.df2[self.df2["A"] >= 40]["C"].max().round(settings.ROUND_DECIMAL_PLACES),
            },
            {
                "covered_y_mean": self.df2[self.df2["B"] < 50]["C"].mean().round(settings.ROUND_DECIMAL_PLACES),
                "covered_y_std": self.df2[self.df2["B"] < 50]["C"].std(ddof=0).round(settings.ROUND_DECIMAL_PLACES),
                "covered_y_min": self.df2[self.df2["B"] < 50]["C"].min().round(settings.ROUND_DECIMAL_PLACES),
                "covered_y_max": self.df2[self.df2["B"] < 50]["C"].max().round(settings.ROUND_DECIMAL_PLACES),
            }
        ]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data, expected_data)
