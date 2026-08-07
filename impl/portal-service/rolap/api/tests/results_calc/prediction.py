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


class PredictionViewTestCase(TestCase):
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
                "decision_attribute": "decision",
                "decision_attribute_distribution": {"a": 1, "b": 2}
            },
            "rules": {
                "rule1": "expression1",
                "rule2": "expression2",
            }
        }
        self.rule_coverage = {
            "rule1": 0.8,
            "rule2": 0.9,
        }
        self.rule_uuid1 = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
        self.rule_uuid2 = "6fa459ea-ee8a-3ca4-894e-db77e160355e"

    def test_prediction_without_specyfing_original_ruleset(self):
        url = reverse("prediction", args=[self.dataset.id])
        self.client.force_authenticate(self.user)

        payload = {
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
            "example_indices": [0, 1, 2]
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_prediction_with_specyfing_nonexisting_original_ruleset(self):
        url = reverse("prediction", args=[self.dataset.id])
        self.client.force_authenticate(self.user)

        payload = {
            'original_ruleset_id': -1,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
            "example_indices": [0, 1, 2]
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_make_prediction_success(self):
        original_calculate_prediction = IndicatorHttpService.calculate_prediction
        IndicatorHttpService.calculate_prediction = lambda self, request: {
            "0": "Iris-setosa",
            "1": "Iris-versicolor",
            "2": "Iris-virginica",
        }
        try:
            url = reverse("prediction", args=[self.dataset.id])
            self.client.force_authenticate(self.user)

            payload = {
                'original_ruleset_id': self.original_ruleset.pk,
                "ruleset": self.ruleset,
                "rule_coverage": self.rule_coverage,
                "example_indices": [0, 1, 2]
            }

            response = self.client.put(url, payload, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertEqual(len(data), 3)
            self.assertEqual(data["0"], "Iris-setosa")
            self.assertEqual(data["1"], "Iris-versicolor")
            self.assertEqual(data["2"], "Iris-virginica")
        finally:
            IndicatorHttpService.calculate_prediction = original_calculate_prediction

    def test_make_prediction_invalid_dataset_id(self):
        url = reverse("prediction", args=[999])
        self.client.force_authenticate(self.user)

        payload = {
            'original_ruleset_id': self.original_ruleset.pk,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
            "example_indices": [0, 1, 2]
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_make_prediction_invalid_payload(self):
        url = reverse("prediction", args=[self.dataset.id])
        self.client.force_authenticate(self.user)
        payload = {
            'original_ruleset_id': self.original_ruleset.pk,
            "ruleset": self.ruleset,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
