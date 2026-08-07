from decision_rules.classification.ruleset import ClassificationRuleSet
from django.conf import settings
from django.http import HttpResponse
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rolap.api.models.projects import Project


class PredictionConfigOptionsTestCase(APITestCase):

    def setUp(self):
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.classification_project: Project = Project.objects.create(
            name='Classification Project',
            description='This is a test project.',
            type_of_problem=Project.CLASSIFICATION,
            owner=self.user,
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.client.force_authenticate(user=self.user)

    def test_for_nonexistent_project(self):
        nonexistent_project_id: int = 0
        url = reverse("prediction-config-options",
                      kwargs={"project_id": nonexistent_project_id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_for_classification_project(self):
        url = reverse("prediction-config-options",
                      kwargs={"project_id": self.classification_project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        prediction_strategies: list[str] = data['prediction_strategy']
        expected_prediction_strategies: list[str] = list(
            ClassificationRuleSet([]).prediction_strategies_choice.keys()
        )
        self.assertEqual(prediction_strategies, expected_prediction_strategies)
