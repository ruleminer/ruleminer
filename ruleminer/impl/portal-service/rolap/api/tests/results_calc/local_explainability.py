from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models.algorithms import VotingMeasures
from rolap.api.models.datasets import Dataset
from rolap.api.models.projects import Project
from rolap.api.models.rulesets.rulesets_db import DEFAULT_MEASURE
from rolap.api.models.rulesets.rulesets_db import INDUCTION_MEASURE_PARAMETER
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.utils.http import IndicatorHttpService


class LocalExplainabilityViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project = Project.objects.create(
            name='Test Project', description='This is a test project.',
            type_of_problem='classification', owner=self.user,
        )
        self.dataset = Dataset.objects.create(
            name='Test dataset 1', project=self.project,
        )
        self.voting_measure = VotingMeasures.objects.create(
            value=DEFAULT_MEASURE,
            description_pl="Opis po polsku",
            description_en="Description in English",
        )
        self.original_ruleset: Ruleset = Ruleset.objects.create(
            name='original_ruleset',
            generation_params={
                INDUCTION_MEASURE_PARAMETER: DEFAULT_MEASURE
            },
            voting_measure=DEFAULT_MEASURE,
            ruleset={},
            attached_to_dataset=self.dataset,
        )
        self.ruleset = {
            "meta": {
                "attributes": ["attr1", "attr2"],
                "decision_attribute": "class",
                "decision_attribute_distribution": {"class1": 1, "class2": 2}
            },
            "rules": {
                "rule1": "expression1",
                "rule2": "expression2",
            }
        }
        self.rule_coverage = {
            "f47ac10b-58cc-4372-a567-0e02b2c3d479": 0.8,
            "6fa459ea-ee8a-3ca4-894e-db77e160355e": 0.9,
        }
        self.rule_uuid1 = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
        self.rule_uuid2 = "6fa459ea-ee8a-3ca4-894e-db77e160355e"
        self.example = [{
            "attr1": 5.0,
            "attr2": 2.0,
        }]
        self.invalid_example = [{
            "attr1": 5.0,
            "attr3": 2.0,
        }]

    def test_local_explainability_success(self):
        original_local_explainability = IndicatorHttpService.local_explainability
        IndicatorHttpService.local_explainability = lambda self, request:  [{
            "covering_rules": {
                "15f7fc7e-89b3-46e9-8043-8cc8682ad1ad": "IF petallength = (-inf, 4.95) AND sepallength = <4.95, inf) AND petalwidth = (-inf, 1.75) AND petallength = <2.35, inf) THEN class = Iris-versicolor (p=46, n=0, P=50, N=100)"
            },
            "decision": "Iris-versicolor"
        }]
        try:
            url = reverse("local-explainability", args=[self.dataset.id])
            self.client.force_authenticate(self.user)

            payload = {
                "examples": self.example,
                "original_ruleset_id": self.original_ruleset.pk,
                "ruleset": self.ruleset,
                "rule_coverage": self.rule_coverage,
            }

            response = self.client.put(url, payload, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertEqual(len(data[0]), 2)
            self.assertEqual(data[0]["decision"], "Iris-versicolor")
            self.assertEqual(len(data[0]["covering_rules"]), 1)
            self.assertIn("15f7fc7e-89b3-46e9-8043-8cc8682ad1ad",
                          data[0]["covering_rules"])
        finally:
            IndicatorHttpService.local_explainability = original_local_explainability

    def test_local_explainability_without_specyfing_original_ruleset(self):
        url = reverse("local-explainability", args=[self.dataset.id])
        self.client.force_authenticate(self.user)

        payload = {
            "examples": self.example,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_local_explainability_with_specyfing_nonexisting_original_ruleset(self):
        url = reverse("local-explainability", args=[self.dataset.id])
        self.client.force_authenticate(self.user)
        payload = {
            "examples": self.example,
            "original_ruleset_id": -1,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_local_explainability_invalid_dataset_id(self):
        url = reverse("local-explainability", args=[999])
        self.client.force_authenticate(self.user)

        payload = {
            "examples": self.example,
            "original_ruleset_id": self.original_ruleset.pk,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_local_explainability_invalid_payload(self):
        url = reverse("local-explainability", args=[self.dataset.id])
        self.client.force_authenticate(self.user)
        payload = {
            "original_ruleset_id": self.original_ruleset.pk,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_local_explainability_invalid_attributes_of_example(self):
        url = reverse("local-explainability", args=[self.dataset.id])
        self.client.force_authenticate(self.user)
        payload = {
            "examples": self.invalid_example,
            "original_ruleset_id": self.original_ruleset.pk,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
