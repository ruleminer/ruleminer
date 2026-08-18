from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient
from rolap.api.models.datasets import Dataset
from rolap.api.models.labels import Label
from rolap.api.models.projects import Project
from rolap.api.models.rulesets.rulesets_db import Rules
from rolap.api.models.rulesets.rulesets_db import Ruleset


class LabelViewTestCase(TestCase):

    def setUp(self) -> None:
        self.client = APIClient()

        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]

        self.label_data: dict = {
            'name': 'Test Label',
            'color': '#FF5733'
        }

        self.label: Label = Label.objects.create(
            name='Existing Label', color='#123456', owner=self.user
        )

    def test_get_returns_label_list(self):
        self.client.force_authenticate(self.user)
        response: Response = self.client.get(reverse('label-list-create'))
        response_data = response.data

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_data), 1)
        self.assertEqual(response_data[0]['name'], self.label.name)
        self.assertEqual(response_data[0]['color'], self.label.color)

    def test_post_creates_label(self):
        self.client.force_authenticate(self.user)
        response: Response = self.client.post(
            reverse('label-list-create'), data=self.label_data
        )
        response_data = response.data

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_data['name'], self.label_data['name'])
        self.assertEqual(response_data['color'], self.label_data['color'])

    def test_patch_updates_label(self):
        self.client.force_authenticate(self.user)
        response: Response = self.client.patch(
            reverse('label-detail', kwargs={'label_id': self.label.id}),
            data={'name': 'Updated Label', 'color': '#654321'}
        )
        response_data = response.data

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data['name'], 'Updated Label')
        self.assertEqual(response_data['color'], '#654321')

    def test_delete_removes_label(self):
        self.client.force_authenticate(self.user)
        response: Response = self.client.delete(
            reverse('label-detail', kwargs={'label_id': self.label.id})
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Label.objects.filter(id=self.label.id).exists())

    def test_access_to_label_not_owned_by_user(self):
        another_user = User.objects.create_user(
            keycloak_id='3', username='anotheruser', email='anotheruser@test.com', password='otherpass'
        )
        another_user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.client.force_authenticate(another_user)
        response: Response = self.client.patch(
            reverse('label-detail', kwargs={'label_id': self.label.id}),
            data={'name': 'Try Updated Label', 'color': '#654321'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_access_to_nonexistent_label(self):
        self.client.force_authenticate(self.user)
        non_existent_label_id = 9999
        response: Response = self.client.patch(
            reverse('label-detail',
                    kwargs={'label_id': non_existent_label_id}),
            data={'name': 'Try Updated Label', 'color': '#654321'}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class RulesLabelsViewTestCase(TestCase):

    def setUp(self) -> None:
        self.client = APIClient()

        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project = Project.objects.create(
            name='Test Project',
            description='Test Project Description',
            type_of_problem=Project.CLASSIFICATION,
            owner=self.user
        )

        self.dataset = Dataset.objects.create(
            project=self.project,
            name='Test Dataset',
            description='Test Dataset Description'
        )

        self.ruleset = Ruleset.objects.create(
            name='Test Ruleset',
            description='Test Ruleset Description',
            attached_to_dataset=self.dataset
        )
        default_indicators = {}
        self.rule1: Rules = Rules.objects.create(
            uuid="123e4567-e89b-12d3-a456-426614174000", description='Test Rule 1', ruleset=self.ruleset, indicators=default_indicators
        )

        self.rule2: Rules = Rules.objects.create(
            uuid="f47ac10b-58cc-4372-a567-0e02b2c3d479", description='Test Rule 2', ruleset=self.ruleset, indicators=default_indicators
        )

        self.label1: Label = Label.objects.create(
            name='Label 1', color='#FF5733', owner=self.user
        )

        self.label2: Label = Label.objects.create(
            name='Label 2', color='#123456', owner=self.user
        )

        self.rule1.assigned_labels.add(self.label1)
        self.rule2.assigned_labels.add(self.label2)

    def test_get_labels_for_ruleset(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            reverse('rule-label', kwargs={'ruleset_id': self.ruleset.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(str(self.rule1.uuid), response.data)
        self.assertIn(str(self.rule2.uuid), response.data)

    def test_post_update_labels_for_ruleset(self):
        update_data = {
            str(self.rule1.uuid): [self.label2.id],
            str(self.rule2.uuid): [self.label1.id]
        }
        self.client.force_authenticate(self.user)
        response = self.client.post(reverse(
            'rule-label', kwargs={'ruleset_id': self.ruleset.id}), update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.rule1.refresh_from_db()
        self.rule2.refresh_from_db()
        self.assertEqual(list(self.rule1.assigned_labels.all()), [self.label2])
        self.assertEqual(list(self.rule2.assigned_labels.all()), [self.label1])

    def test_access_to_ruleset_not_owned_by_user(self):
        another_user: User = User.objects.create_user(
            keycloak_id='2', username='anothertestuser', email='testuser2@test.com', password='testpass2'
        )
        another_user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.client.force_authenticate(another_user)
        response = self.client.get(
            reverse('rule-label', kwargs={'ruleset_id': self.ruleset.id}))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_access_to_nonexistent_ruleset(self):
        nonexistent_ruleset_id = 99999
        self.client.force_authenticate(self.user)
        response = self.client.get(
            reverse('rule-label', kwargs={'ruleset_id': nonexistent_ruleset_id}))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_post_with_invalid_rule_uuids(self):
        invalid_data = {
            "3f6fa0b8-b237-4e5d-b8a7-0c74f53f8e4f": [self.label1.id]
        }
        self.client.force_authenticate(self.user)
        response = self.client.post(reverse(
            'rule-label', kwargs={'ruleset_id': self.ruleset.id}), invalid_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_post_with_invalid_label_ids(self):
        invalid_data = {
            str(self.rule1.uuid): [99999]
        }
        self.client.force_authenticate(self.user)
        response = self.client.post(reverse(
            'rule-label', kwargs={'ruleset_id': self.ruleset.id}), invalid_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
