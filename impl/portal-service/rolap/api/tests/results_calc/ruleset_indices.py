import json

from django.urls import reverse
from rest_framework import status
from rolap.api.tests.datasets.rulesets import BaseSetup


class DatasetRulesetIndicesTestCase(BaseSetup):
    def test_show_dataset_indices(self):
        url = reverse("rule_covered_dataset_indices", kwargs={
                      "dataset_id": self.dataset.pk})
        self.client.force_authenticate(self.user)
        response = self.client.post(url, {"ruleset": json.dumps(self.ruleset)})
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            len(content["9dda02a4-0dab-4714-b0a7-56f410165656"]), 48)
        self.assertEqual(
            len(content["e0f2d544-591b-4bd4-aa14-9af1ac315724"]), 50)
        self.assertEqual(
            len(content["15f7fc7e-89b3-46e9-8043-8cc8682ad1ad"]), 46)

    def test_show_dataset_indices_unauthorized(self):
        url = reverse("rule_covered_dataset_indices", kwargs={
                      "dataset_id": self.dataset.pk})
        response = self.client.post(url, {"ruleset": json.dumps(self.ruleset)})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
