import json

from django.urls import reverse
from rest_framework import status
from rolap.api.serializers.results import PredictionIndicatorsSerializer
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase


class PredictionIndicatorsTestCase(RulesetAbstractTestCase):
    def test_get_prediction_indicators_result(self):
        url = reverse("prediction-indicators",
                      kwargs={
                          "dataset_id": self.dataset_id,
                          "ruleset_id": self.ruleset.id
                      })
        self.client.force_authenticate(self.user)
        response = self.client.get(
            url
        )
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        serializer = PredictionIndicatorsSerializer(data=content)
        self.assertTrue(serializer.is_valid(), content)


class PredictionIndicatorsSummaryTestCase(RulesetAbstractTestCase):
    def test_get_prediction_indicators_list_result(self):
        url = reverse("rulesets-prediction-indicators-summary",
                      kwargs={
                          "dataset_id": self.dataset_id
                      })
        self.client.force_authenticate(self.user)
        response = self.client.get(
            url
        )
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(content, list), content)
        self.assertTrue(all(isinstance(item, dict)
                        for item in content), content)
