from unittest.mock import patch

from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.projects import Project
from rolap.api.utils.http import IndicatorHttpService


class DeterminationRuleIndicatorsViewTestCase(TestCase):
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
                "rule1": "expression1",
                "rule2": "expression2",
            }
        }
        self.rule_coverage = {
            "rule1": 0.8,
            "rule2": 0.9,
        }

    @patch.object(IndicatorHttpService, 'calculate_rules_indicators')
    @patch.object(IndicatorHttpService, 'calculate_histograms')
    def test_calculate_rules_indicators_success(
        self,
        mocked_calculate_histograms,
        mocked_calculate_rules_indicators,
    ):
        mocked_calculate_rules_indicators.return_value = [
            {
                "rule_uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                "indicators": {"accuracy": 0.8, "precision": 0.75, "lr+": "inf"},
            },
            {
                "rule_uuid": "6fa459ea-ee8a-3ca4-894e-db77e160355e",
                "indicators": {"accuracy": 0.9, "precision": 0.85, "lr+": 46.0},
            }
        ]
        mocked_calculate_histograms.return_value = {
            "max": 6,
            "min": 0,
            "bin_edges": [
                7.32,
                15.218,
                23.116,
                31.013999999999996,
                38.91199999999999,
                46.809999999999995,
                54.70799999999999,
                62.605999999999995,
                70.50399999999999,
                78.40199999999999,
                86.3
            ],
            "histograms": {
                "f47ac10b-58cc-4372-a567-0e02b2c3d479": [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    4,
                    2
                ],
                "6fa459ea-ee8a-3ca4-894e-db77e160355e": [
                    2,
                    6,
                    1,
                    1,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ]
            }
        }
        url = reverse("determination-rules-indicators",
                      args=[self.dataset.id])
        self.client.force_authenticate(self.user)

        payload = {
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
            "bins": 10,
        }

        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertIn("indicators_data", data)
        self.assertEqual(len(data["indicators_data"]), 2)

        if self.project.type_of_problem == "regression":
            self.assertIn("histograms_data", data)
            self.assertIn("max", data["histograms_data"])
            self.assertIn("min", data["histograms_data"])
            self.assertIn("bin_edges", data["histograms_data"])
            self.assertIn("histograms", data["histograms_data"])
        else:
            self.assertNotIn("histograms_data", data)

    def test_calculate_rules_indicators_invalid_dataset_id(self):
        url = reverse("determination-rules-indicators", args=[999])
        self.client.force_authenticate(self.user)

        payload = {
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
            "bins": 10,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_calculate_rules_indicators_invalid_payload(self):
        url = reverse("determination-rules-indicators", args=[self.dataset.id])
        self.client.force_authenticate(self.user)
        payload = {
            "ruleset": self.ruleset,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DeterminationSingleRuleIndicatorsViewTestCase(TestCase):
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
        self.attributes = [
            DatasetAttributes.objects.create(
                name='attr1',
                type=DatasetAttributes.DataAttributeTypes.NUMERICAL,
                role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE,
                missing_values_count=0,
                dataset=self.dataset,
            ),
            DatasetAttributes.objects.create(
                name='attr2',
                type=DatasetAttributes.DataAttributeTypes.NUMERICAL,
                role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE,
                missing_values_count=0,
                dataset=self.dataset,
            ),
            DatasetAttributes.objects.create(
                name='label',
                type=DatasetAttributes.DataAttributeTypes.NUMERICAL,
                role=DatasetAttributes.DataAttributeRoles.CLASSIFICATION,
                missing_values_count=0,
                dataset=self.dataset,
            ),
        ]

    @patch.object(IndicatorHttpService, 'calculate_single_rule_indicators')
    def test_calculate_rules_indicators_success(self, mocked_calculate_single_rule_indicators):
        EXPECTED_INDICATORS: dict = {
            "accuracy": 0.8, "precision": 0.75, "lr+": "inf"
        }
        mocked_calculate_single_rule_indicators.return_value = EXPECTED_INDICATORS
        url = reverse(
            "determination-single-rule-indicators",
            args=[self.dataset.id]
        )
        self.client.force_authenticate(self.user)

        payload = {
            "rule": {},
            "attributes": list(map(lambda x: x.name, self.attributes)),
        }

        response = self.client.put(url, payload, format='json')
        data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            data, EXPECTED_INDICATORS,
            'Response should match the expected one.'
        )

    def test_calculate_rules_indicators_invalid_dataset_id(self):
        url = reverse("determination-single-rule-indicators",
                      args=[self.dataset.id + 1])
        self.client.force_authenticate(self.user)

        payload = {
            "rule": {},
            "attributes": list(map(lambda x: x.name, self.attributes)),
        }

        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class RuleMetricsListViewTestCase(TestCase):

    URL_NAME = "rule-available-indicators-list"

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        another_user = User.objects.create_user(
            keycloak_id='2', username='testuser2', email='testuser2@test.com', password='testpass'
        )
        self.user._permissions = another_user._permissions = [
            settings.KEYCLOAK_USER_ROLE
        ]
        self.project = Project.objects.create(
            name='Test Project', description='This is a test project.',
            type_of_problem=Project.CLASSIFICATION, owner=self.user,
        )
        self.another_user_project = Project.objects.create(
            name='Test Project 2', description='This is a test project 2.',
            type_of_problem=Project.CLASSIFICATION, owner=another_user,
        )

    def test_getting_available_metrics_names(self):
        PROBLEM_TYPES = [
            Project.CLASSIFICATION,
            Project.REGRESSION, Project.SURVIVAL
        ]
        for problem_type in PROBLEM_TYPES:
            self.project.type_of_problem = problem_type
            self.project.save()
            url = reverse(self.URL_NAME, kwargs={
                          'project_id': self.project.id})
            self.client.force_authenticate(self.user)
            response = self.client.get(url, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIsInstance(response.json()['indicators'], list)
            self.assertTrue(all(
                isinstance(metric_name, str) for metric_name in response.json()['indicators']
            ))

    def test_for_someones_else_project(self):
        url = reverse(self.URL_NAME, kwargs={
                      'project_id': self.another_user_project.id})
        self.client.force_authenticate(self.user)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
