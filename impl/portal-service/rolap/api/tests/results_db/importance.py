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


class ImportanceViewTestCase(APITestCase):
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
            algorithm=self.algorithm
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

    def test_get_request_with_results(self):
        url = reverse('importance', args=[
                      self.dataset.id, self.ruleset_original.id])
        self.client.force_authenticate(self.user)
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('condition_importance', response.data)
        self.assertIn('attribute_importance', response.data)
        self.assertEqual(
            response.data['condition_importance'], self.importance_result.condition_importance)
        self.assertEqual(
            response.data['attribute_importance'], self.importance_result.attribute_importance)

    def test_get_request_without_results(self):
        ImportanceResults.objects.all().delete()
        url = reverse('importance', args=[
                      self.dataset.id, self.ruleset_original.id])
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
