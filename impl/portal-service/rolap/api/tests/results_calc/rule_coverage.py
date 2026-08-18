from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models.datasets import Dataset
from rolap.api.models.projects import Project
from rolap.api.utils.http import IndicatorHttpService


class DeterminationRuleCoverageViewTestCase(APITestCase):

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

        self.mock_response_data = {
            "9dda02a4-0dab-4714-b0a7-56f410165656": {
                "p": 46,
                "n": 2,
                "P": 50,
                "N": 100
            },
            "e0f2d544-591b-4bd4-aa14-9af1ac315724": {
                "p": 50,
                "n": 0,
                "P": 50,
                "N": 100
            },
            "15f7fc7e-89b3-46e9-8043-8cc8682ad1ad": {
                "p": 46,
                "n": 0,
                "P": 50,
                "N": 100
            }
        }

        self.original_calculate_coveragres = IndicatorHttpService.calculate_rule_coverage
        IndicatorHttpService.calculate_rule_coverage = lambda s, r: self.mock_response_data

    def tearDown(self) -> None:
        IndicatorHttpService.calculate_rule_coverage = self.original_calculate_coveragres
        return super().tearDown()

    def test_determination_rule_coverage_success(self):
        url = reverse("rule-coverage-determination", args=[self.dataset.id])
        self.client.force_authenticate(self.user)

        payload = {
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

        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("rule_coverage", data)
        self.assertEqual(data["rule_coverage"], self.mock_response_data)

    def test_determination_rule_coverage_invalid_dataset_id(self):
        url = reverse("rule-coverage-determination", args=[999])
        self.client.force_authenticate(self.user)

        payload = {
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

        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_determination_rule_coverage_invalid_payload(self):
        url = reverse("rule-coverage-determination", args=[self.dataset.id])
        self.client.force_authenticate(self.user)
        payload = {
            "rules": {
                "f47ac10b-58cc-4372-a567-0e02b2c3d479": "expression1",
                "6fa459ea-ee8a-3ca4-894e-db77e160355e": "expression2",
            }
        }

        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
