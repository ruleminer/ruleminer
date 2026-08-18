import json
import unittest

from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase


class ManageAlgorithmTestCase(APITestCase):
    def setUp(self):
        self.client: APIClient = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_OPERATOR_ROLE]
        self.algorithm_json: dict = json.load(
            open(
                'test_data/jsons/algorithms/rulekit/classification.json',
                mode='r',
                encoding='utf-8'
            )
        )

    def test_add_algorithm(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("algorithms-list")
        response = self.client.post(url, self.algorithm_json, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_add_algorithm_unauthenticated(self):
        url = reverse("algorithms-list")
        response = self.client.post(url, self.algorithm_json, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_add_algorithm_not_operator(self):
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.client.force_authenticate(user=self.user)
        url = reverse("algorithms-list")
        response = self.client.post(url, self.algorithm_json, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @unittest.skip("This feature is not implemented yet")
    def test_add_new_algorithm_without_question_and_na_params(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("algorithms-list")
        questions = self.algorithm_json['questions']
        na_params = self.algorithm_json['na_params']
        self.algorithm_json['questions'] = []
        self.algorithm_json['na_params'] = []
        response = self.client.post(url, self.algorithm_json, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        url = reverse("algorithms-detail", kwargs={
                      'algorithm_id': response.data['id']})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["questions"], questions)
        self.assertEqual(response.data["na_params"], na_params)
