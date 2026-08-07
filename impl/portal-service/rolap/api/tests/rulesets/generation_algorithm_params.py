import json

from django.urls import reverse
from rest_framework import status
from rolap.api.serializers.rulesets.rulesets import RulesetGenerationAlgorithmParamsSerializer
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase


class RulesetGenerationAlgorithmParamsViewTestCase(RulesetAbstractTestCase):
    def setUp(self):
        super().setUp()

    def test_get_algorithm_params_result(self):
        url = reverse("ruleset-generation-params",
                      kwargs={
                          "dataset_id": self.dataset_id,
                          "ruleset_id": self.ruleset.id
                      })

        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        serializer = RulesetGenerationAlgorithmParamsSerializer(data=content)
        self.assertTrue(serializer.is_valid(), content)
        algorithm_params = content['generation_algorithm_params']
        self.assertEqual(algorithm_params['pruning_measure'], "Precision")
        self.assertEqual(algorithm_params['induction_measure'], "Precision")
        self.assertEqual(algorithm_params['min_rule_coverage'], 1)

    def test_nonexistent_ruleset(self):
        non_existent_id = 9999
        url = reverse("ruleset-generation-params",
                      kwargs={
                          "dataset_id": self.dataset_id,
                          "ruleset_id": non_existent_id
                      })

        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
