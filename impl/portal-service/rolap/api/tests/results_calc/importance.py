from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rolap.api.models import Algorithm
from rolap.api.models import AlgorithmParams
from rolap.api.models import Dataset
from rolap.api.models import ImportanceResults
from rolap.api.models import Project
from rolap.api.models import Ruleset
from rolap.api.models.algorithms import VotingMeasures
from rolap.api.models.rulesets.rulesets_db import DEFAULT_MEASURE
from rolap.api.utils.http import IndicatorHttpService


class DeterminationImportanceViewTestCase(APITestCase):
    def setUp(self):
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
        self.algorithm = Algorithm.objects.create(
            problem_type=Algorithm.CLASSIFICATION,
            name='Test Algorithm',
            version='1.0',
            description_pl='Opis po polsku',
            description_en='Description in English'
        )
        self.voting_measure = VotingMeasures.objects.create(
            value=DEFAULT_MEASURE,
            description_pl="Opis po polsku",
            description_en="Description in English",
        )
        self.algorithm_params = AlgorithmParams.objects.create(
            algorithm=self.algorithm,
            name='Param1',
            parameter_type=AlgorithmParams.INTEGER,
            description_pl='Opis parametru po polsku',
            description_en='Parameter description in English',
            default_value='10',
            min_value='5',
            max_value='20'
        )
        self.ruleset_original = Ruleset.objects.create(
            name='Test Ruleset',
            description="Test description",
            generation_params={'key': 'value'},
            ruleset={'key': 'value'},
            rules_count=2,
            avg_conditions_count=1.5,
            avg_precision=0.75,
            avg_coverage=0.85,
            attached_to_dataset=self.dataset,
            generated_from_dataset=self.dataset,
            algorithm=self.algorithm,
            voting_measure=DEFAULT_MEASURE,
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
        self.importance_result = ImportanceResults.objects.create(
            condition_importance={'0': {'a = {high}': 0.5}},
            attribute_importance={'0': {'a': 2.0}},
            ruleset=self.ruleset_original
        )

    def test_put_request_success(self):
        original_calculate_importance = IndicatorHttpService.calculate_importance
        IndicatorHttpService.calculate_importance = lambda self, request: {
            "condition_importance": {
                "0": {
                    "a = {high}": 0.7363636363636363,
                    "a = {vhigh}": 0.7636363636363637
                },
                "1": {
                    "a = {low}": 0.7666666666666666,
                    "a = {medium}": 0.7333333333333334
                }
            },
            "attribute_importance": {
                "0": {
                    "a": 1.5
                },
                "1": {
                    "a": 1.5
                }
            }
        }

        url = reverse('determination-importance', args=[
                      self.dataset.id])
        self.client.force_authenticate(self.user)
        payload = {
            'original_ruleset_id': self.ruleset_original.id,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }

        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data['condition_importance'], {
            "0": {
                "a = {high}": 0.7363636363636363,
                "a = {vhigh}": 0.7636363636363637
            },
            "1": {
                "a = {low}": 0.7666666666666666,
                "a = {medium}": 0.7333333333333334
            }
        })
        self.assertEqual(data['attribute_importance'], {
            "0": {
                "a": 1.5
            },
            "1": {
                "a": 1.5
            }
        })

        IndicatorHttpService.calculate_importance = original_calculate_importance

    def test_put_request_failure(self):
        url = reverse('determination-importance', args=[self.dataset.id])
        self.client.force_authenticate(self.user)
        payload = {
            'original_ruleset_id': self.ruleset_original.id,
            "rule_coverage": self.rule_coverage,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_put_request_invalid_dataset_id(self):
        url = reverse('determination-importance', args=[999])
        self.client.force_authenticate(self.user)
        payload = {
            'original_ruleset_id': self.ruleset_original.id,
            "ruleset": self.ruleset,
            "rule_coverage": self.rule_coverage,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
