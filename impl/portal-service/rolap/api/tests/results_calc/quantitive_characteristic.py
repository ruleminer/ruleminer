from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models.algorithms import VotingMeasures
from rolap.api.models.datasets import Dataset
from rolap.api.models.indicators import QuantitativeCharacteristics
from rolap.api.models.projects import Project
from rolap.api.models.rulesets.rulesets_db import DEFAULT_MEASURE
from rolap.api.models.rulesets.rulesets_db import INDUCTION_MEASURE_PARAMETER
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.utils.http import IndicatorHttpService


class DeterminationQuantitativeCharacteristicsViewTestCase(APITestCase):

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
                "f47ac10b-58cc-4372-a567-0e02b2c3d479": "expression1",
                "6fa459ea-ee8a-3ca4-894e-db77e160355e": "expression2",
            }
        }
        self.rule_coverage = {
            "f47ac10b-58cc-4372-a567-0e02b2c3d479": 0.8,
            "6fa459ea-ee8a-3ca4-894e-db77e160355e": 0.9,
        }
        self.mock_response_data = {
            "rules_count": 3.0,
            "avg_conditions_count": 2.0,
            "avg_precision": 0.99,
            "avg_coverage": 0.95,
            "fraction_significant": 0.93,
            "fraction_FDR_significant": 0.93,
            "total_conditions_count": 70

        }

        self.original_method = IndicatorHttpService.calculate_characteristic

        def mock_calculate_characteristic(*args, **kwargs):
            return QuantitativeCharacteristics(**self.mock_response_data)
        IndicatorHttpService.calculate_characteristic = mock_calculate_characteristic

    def tearDown(self):
        IndicatorHttpService.calculate_characteristic = self.original_method
        super().tearDown()

    def test_without_specyfing_original_ruleset(self):
        url = reverse("quantitative-characteristic-determination",
                      args=[self.dataset.id])
        self.client.force_authenticate(self.user)

        payload = {
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_with_specyfing_nonexisting_original_ruleset(self):
        url = reverse("quantitative-characteristic-determination",
                      args=[self.dataset.id])
        self.client.force_authenticate(self.user)

        payload = {
            "original_ruleset_id": -1,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_determination_quantitative_characteristics_success(self):
        url = reverse("quantitative-characteristic-determination",
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
        self.assertAlmostEqual(data["rules_count"],
                               self.mock_response_data["rules_count"])
        self.assertAlmostEqual(
            data["avg_conditions_count"], self.mock_response_data["avg_conditions_count"])
        self.assertAlmostEqual(
            data["avg_precision"], self.mock_response_data["avg_precision"])
        self.assertAlmostEqual(
            data["avg_coverage"], self.mock_response_data["avg_coverage"])
        self.assertAlmostEqual(
            data["fraction_significant"], self.mock_response_data["fraction_significant"])
        self.assertAlmostEqual(
            data["fraction_FDR_significant"], self.mock_response_data["fraction_FDR_significant"])
        self.assertAlmostEqual(
            data["total_conditions_count"], self.mock_response_data["total_conditions_count"])

    def test_determination_quantitative_characteristics_invalid_dataset_id(self):
        url = reverse("quantitative-characteristic-determination", args=[999])
        self.client.force_authenticate(self.user)

        payload = {
            "original_ruleset_id": self.original_ruleset.pk,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }

        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_determination_quantitative_characteristics_invalid_payload(self):
        url = reverse("quantitative-characteristic-determination",
                      args=[self.dataset.id])
        self.client.force_authenticate(self.user)
        payload = {
            "original_ruleset_id": self.original_ruleset.pk,
            "ruleset": self.ruleset,
        }

        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
