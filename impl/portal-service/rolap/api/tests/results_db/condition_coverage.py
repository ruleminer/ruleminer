import pandas as pd
from django.urls import reverse
from rest_framework import status
from rolap.api.tests.datasets.rulesets import BaseSetup


class ConditionCoverageViewTestCase(BaseSetup):
    def setUp(self):
        super().setUp()
        self.request_data = {
            "meta": {"attributes": self.ruleset["meta"]["attributes"]},
            "conditions": [
                rule["premise"]["subconditions"]
                for rule in self.ruleset["rules"]
            ]
        }
        self.dataset.number_of_rows = len(self.df)

    def test_condition_coverage(self):
        self.request_data["complementary"] = False
        url = reverse("dataset_condition_coverage", kwargs={
            "dataset_id": self.dataset.pk})
        self.client.force_authenticate(self.user)
        response = self.client.post(url, self.request_data, format="json")
        response_data = [
            pd.Series(row).sum() for row in response.data
        ]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_data), 3)
        self.assertEqual(response_data, [48, 50, 46])

    def test_complementary_condition_coverage(self):
        self.request_data["complementary"] = True
        url = reverse("dataset_condition_coverage", kwargs={
            "dataset_id": self.dataset.pk})
        self.client.force_authenticate(self.user)
        response = self.client.post(url, self.request_data, format="json")
        response_data = [
            pd.Series(row).sum() for row in response.data
        ]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_data), 3)
        self.assertEqual(response_data, [102, 100, 104])
