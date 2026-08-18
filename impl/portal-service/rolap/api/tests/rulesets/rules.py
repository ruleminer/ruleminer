import json
import uuid

from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models.datasets import Dataset
from rolap.api.models.projects import Project
from rolap.api.models.rulesets.rulesets_db import Rules
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.serializers.results import RulesDataSerializer
from rolap.api.serializers.rulesets.rulesets import CoverageSerializer
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase


class RulesTestCases(RulesetAbstractTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_rules_coverage_result(self):
        url = reverse("rules-coverage",
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

        serializer = CoverageSerializer(data=content)
        self.assertTrue(serializer.is_valid(), content)

    def test_rules_indicators_result(self):
        url = reverse("rules-indicators",
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

        serializer = RulesDataSerializer(data=content)
        self.assertTrue(serializer.is_valid(), content)

    def test_rules_indicators_result_forbidden(self):
        url = reverse("rules-indicators",
                      kwargs={
                          "dataset_id": self.dataset_id,
                          "ruleset_id": self.ruleset.id
                      })
        self.user._permissions = []
        self.client.force_authenticate(self.user)
        response = self.client.get(
            url
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class RuleDetailViewTest(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project = Project.objects.create(
            name='Test Project', description='This is a test project.', type_of_problem='classification', owner=self.user
        )
        self.dataset = Dataset.objects.create(
            name='Test dataset 1', delimiter=',', project=self.project, path='550e8400-e29b-41d4-a716-446655440000'
        )
        self.ruleset = Ruleset.objects.create(
            name='Test ruleset', description='This is a test ruleset.', attached_to_dataset=self.dataset
        )
        self.rule_uuid = uuid.uuid4()
        self.rule = Rules.objects.create(
            uuid=self.rule_uuid, description='Test rule description', ruleset=self.ruleset,
            p=1, n=2, P=3, N=4, indicators={}, created_at='2023-01-01T00:00:00Z'
        )

    def test_get_rule_detail(self):
        url = reverse('rule-details', kwargs={'dataset_id': self.dataset.id,
                      'ruleset_id': self.ruleset.id, 'rule_uuid': self.rule_uuid})
        self.client.force_authenticate(user=self.user)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], self.rule.description)

    def test_get_nonexistent_rule_detail(self):
        nonexistent_uuid = uuid.uuid4()
        url = reverse('rule-details', kwargs={'dataset_id': self.dataset.id,
                      'ruleset_id': self.ruleset.id, 'rule_uuid': nonexistent_uuid})
        self.client.force_authenticate(user=self.user)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_rule(self):
        url = reverse('rule-details', kwargs={'dataset_id': self.dataset.id,
                      'ruleset_id': self.ruleset.id, 'rule_uuid': self.rule_uuid})
        self.client.force_authenticate(user=self.user)
        updated_data = {'description': 'Updated rule description'}

        response = self.client.patch(url, data=updated_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.rule.refresh_from_db()
        self.assertEqual(self.rule.description, updated_data['description'])

    def test_delete_rule_description(self):
        url = reverse('rule-details', kwargs={'dataset_id': self.dataset.id,
                      'ruleset_id': self.ruleset.id, 'rule_uuid': self.rule_uuid})
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.rule.refresh_from_db()
        self.assertIsNone(self.rule.description)
