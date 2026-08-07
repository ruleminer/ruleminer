from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models.algorithms import VotingMeasures
from rolap.api.models.datasets import Dataset
from rolap.api.models.projects import Project
from rolap.api.models.rulesets.rulesets_db import DEFAULT_MEASURE
from rolap.api.models.rulesets.rulesets_db import INDUCTION_MEASURE_PARAMETER
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.utils.http import IndicatorHttpService


class DeterminationPredictionIndicatorsViewTestCase(APITestCase):
    def mock_post(self, *args, **kwargs):
        class MockResponse:
            def __init__(self, json_data, status_code):
                self.json_data = json_data
                self.status_code = status_code

            def json(self):
                return self.json_data

        return MockResponse(self.mock_response_data, 200)

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
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
            ruleset={},
            voting_measure=DEFAULT_MEASURE,
            attached_to_dataset=self.dataset,
        )

        self.ruleset = {
            "meta": {
                "attributes": ["attr1", "attr2"],
                "decision_attribute": "decision",
                "decision_attribute_distribution": {"a": 1, "b": 2}
            },
            "rules": {
                "f47ac10b-58cc-4372-a567-0e02b2c3d479": "expression1",
                "6fa459ea-ee8a-3ca4-894e-db77e160355e": "expression2",
            }
        }
        self.rule_coverage = {
            "f47ac10b-58cc-4372-a567-0e02b2c3d479": 0.8,
            "6fa459ea-ee8a-3ca4-894e-db77e160355e": 0.9,
        }
        self.rule_uuid1 = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
        self.rule_uuid2 = "6fa459ea-ee8a-3ca4-894e-db77e160355e"
        self.mock_response_data = {
            "type_of_problem": "classification",
            "general": {
                "Balanced_accuracy": 0.9733333333333333,
                "F1_micro": 0.9733333333333334,
                "F1_macro": 0.9732905982905983,
                "F1_weighted": 0.9732905982905984,
                "G_mean_micro": 0.9799773240006912,
                "G_mean_macro": 0.9799773240006912,
                "G_mean_weighted": 0.9799773240006912,
                "Recall_micro": 0.9733333333333334,
                "Recall_macro": 0.9733333333333333,
                "Recall_weighted": 0.9733333333333334,
                "Specificity": 1.0,
                "Confusion_matrix": {
                    "classes": ["Iris-setosa", "Iris-versicolor", "Iris-virginica"],
                    "Iris-setosa": [50, 0, 0],
                    "Iris-versicolor": [0, 46, 4],
                    "Iris-virginica": [0, 0, 50]}},
            "for_classes": {
                "Iris-setosa": {
                    "TP": 50,
                    "FP": 0,
                    "TN": 100,
                    "FN": 0,
                    "Recall": 1.0,
                    "Specificity": 1.0,
                    "F1_score": 1.0,
                    "G_mean": 1.0,
                    "MCC": 1.0,
                    "PPV": 1.0,
                    "NPV": 1.0,
                    "LR_plus": 0.0,
                    "LR_minus": 0.0,
                    "Odd_ratio": 0.0,
                    "Relative_risk": 0.0,
                    "Confusion_matrix": {
                        "classes": ["Iris-setosa", "other"],
                        "Iris-setosa": [50, 0],
                        "other": [0, 100]}},
                    "Iris-versicolor": {
                        "TP": 46,
                        "FP": 0,
                        "TN": 100,
                        "FN": 4,
                        "Recall": 0.92,
                        "Specificity": 1.0,
                        "F1_score": 0.9583333333333334,
                        "G_mean": 0.9591663046625439,
                        "MCC": 0.9405399431259602,
                        "PPV": 1.0,
                        "NPV": 0.9615384615384616,
                        "LR_plus": 0.0,
                        "LR_minus": 0.07999999999999996,
                        "Odd_ratio": 0.0,
                        "Relative_risk": 26.0,
                        "Confusion_matrix": {
                            "classes": ["Iris-versicolor", "other"],
                            "Iris-versicolor": [46, 4],
                            "other": [0, 100]}},
                    "Iris-virginica": {
                        "TP": 50,
                        "FP": 4,
                        "TN": 96,
                        "FN": 0,
                        "Recall": 1.0,
                        "Specificity": 0.96,
                        "F1_score": 0.9615384615384615,
                        "G_mean": 0.9797958971132712,
                        "MCC": 0.9428090415820634,
                        "PPV": 0.9259259259259259,
                        "NPV": 1.0,
                        "LR_plus": 24.99999999999998,
                        "LR_minus": 0.0,
                        "Odd_ratio": 0.0,
                        "Relative_risk": 0.0,
                        "Confusion_matrix": {
                            "classes": ["Iris-virginica", "other"],
                            "Iris-virginica": [50, 0],
                            "other": [4, 96]}
                }
            }
        }

        self.original_method = IndicatorHttpService.calculate_prediction_indicators

        def mocked_method(*args, **kwargs):
            return self.mock_response_data
        IndicatorHttpService.calculate_prediction_indicators = mocked_method

    def tearDown(self):
        IndicatorHttpService.calculate_prediction_indicators = self.original_method
        super().tearDown()

    def test_without_specyfing_original_ruleset(self):
        url = reverse("prediction-indicators-determination",
                      args=[self.dataset.id])
        self.client.force_authenticate(self.user)

        payload = {
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_with_specyfing_nonexisting_original_ruleset(self):
        url = reverse("prediction-indicators-determination",
                      args=[self.dataset.id])
        self.client.force_authenticate(self.user)

        payload = {
            "original_ruleset_id": -1,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_determination_prediction_indicators_success(self):
        url = reverse("prediction-indicators-determination",
                      args=[self.dataset.id])
        self.client.force_authenticate(self.user)

        payload = {
            "original_ruleset_id": self.original_ruleset.pk,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }

        response = self.client.put(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("type_of_problem", data)
        self.assertIn("general", data)
        self.assertIn("for_classes", data)

        self.assertEqual(data["type_of_problem"], "classification")
        self.assertIsInstance(data["general"], dict)
        self.assertIsInstance(data["for_classes"], dict)

        self.assertIn("Balanced_accuracy", data["general"])
        self.assertIn("F1_micro", data["general"])
        self.assertIn("Recall_micro", data["general"])
        self.assertIn("Confusion_matrix", data["general"])

        self.assertIn("Iris-setosa", data["for_classes"])
        self.assertIn("Iris-versicolor", data["for_classes"])
        self.assertIn("Iris-virginica", data["for_classes"])

    def test_determination_prediction_indicators_invalid_dataset_id(self):
        url = reverse("prediction-indicators-determination", args=[999])
        self.client.force_authenticate(self.user)

        payload = {
            "original_ruleset_id": self.original_ruleset.pk,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }

        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_determination_prediction_indicators_invalid_payload(self):
        url = reverse("prediction-indicators-determination",
                      args=[self.dataset.id])
        self.client.force_authenticate(self.user)
        payload = {
            "original_ruleset_id": self.original_ruleset.pk,
            "ruleset": self.ruleset,
        }

        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
