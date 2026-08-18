from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase
from rolap.api.utils.http import IndicatorHttpService


class MeasuresListViewTest(APITestCase):

    def setUp(self) -> None:
        self.client = APIClient()

        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]

    def test_get_measures_list(self):
        url = reverse("measures-list")
        self.client.force_authenticate(self.user)
        response: Response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data, ["Jaccard", "Correlation", "Kulczynski"])


class RuleSimilarityViewTestCase(RulesetAbstractTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_calculate_similarity(self):
        try:
            oryginal_calculate_rule_similarity = IndicatorHttpService.calculate_rule_similarity
            IndicatorHttpService.calculate_rule_similarity = lambda self, request: {
                "IF petalwidth = <1.65, inf) THEN class = Iris-virginica ": {
                    "IF petalwidth = <1.65, inf) THEN class = Iris-virginica ": 1.0,
                    "IF petallength = (-inf, 2.35) THEN class = Iris-setosa ": 0.0,
                    "IF petallength = (-inf, 4.95) AND sepallength = <4.95, inf) AND petalwidth = (-inf, 1.75) AND petallength = <2.35, inf) THEN class = Iris-versicolor ": 0.0
                },
                "IF petallength = (-inf, 2.35) THEN class = Iris-setosa ": {
                    "IF petalwidth = <1.65, inf) THEN class = Iris-virginica ": 0.0,
                    "IF petallength = (-inf, 2.35) THEN class = Iris-setosa ": 1.0,
                    "IF petallength = (-inf, 4.95) AND sepallength = <4.95, inf) AND petalwidth = (-inf, 1.75) AND petallength = <2.35, inf) THEN class = Iris-versicolor ": 0.0
                },
                "IF petallength = (-inf, 4.95) AND sepallength = <4.95, inf) AND petalwidth = (-inf, 1.75) AND petallength = <2.35, inf) THEN class = Iris-versicolor ": {
                    "IF petalwidth = <1.65, inf) THEN class = Iris-virginica ": 0.0,
                    "IF petallength = (-inf, 2.35) THEN class = Iris-setosa ": 0.0,
                    "IF petallength = (-inf, 4.95) AND sepallength = <4.95, inf) AND petalwidth = (-inf, 1.75) AND petallength = <2.35, inf) THEN class = Iris-versicolor ": 1.0
                }
            }

            measure_list: list = ["Jaccard", "Correlation", "Kulczynski"]
            for measure in measure_list:
                payload = {
                    "similarity_type": "semantic",
                    "measure": measure,
                    "ruleset_1": self.ruleset.ruleset,
                    "ruleset_2": self.ruleset.ruleset
                }
                url = reverse("rule-similarity",
                              kwargs={
                                  "dataset_id": self.dataset_id
                              })

                self.client.force_authenticate(self.user)
                response: Response = self.client.put(
                    url, payload, format='json')

                self.assertEqual(response.status_code, status.HTTP_200_OK)
                data = response.json()
                self.assertIn("rule_similarity", data)
                self.assertEqual(len(data["rule_similarity"]), 3)

        finally:
            IndicatorHttpService.calculate_rule_similarity = oryginal_calculate_rule_similarity

    def test_nonexistent_dataset(self):
        """
        Test if a nonexistent dataset returns an error.
        """
        nonexistent_dataset_id = 99999
        payload = {
            "similarity_type": "semantic",
            "measure": "Jaccard",
            "ruleset_1": self.ruleset.ruleset,
            "ruleset_2": self.ruleset.ruleset
        }
        url = reverse("rule-similarity",
                      kwargs={"dataset_id": nonexistent_dataset_id})

        self.client.force_authenticate(self.user)
        response: Response = self.client.put(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_dataset_not_owned_by_user(self):
        """
        Test if a dataset not owned by the current user returns an error.
        """
        another_user: User = User.objects.create_user(
            keycloak_id='2', username='another_user', email='testuser2@test.com', password='testpass'
        )
        another_user._permissions = [settings.KEYCLOAK_USER_ROLE]

        self.client.force_authenticate(another_user)
        payload = {
            "similarity_type": "semantic",
            "measure": "Jaccard",
            "ruleset_1": self.ruleset.ruleset,
            "ruleset_2": self.ruleset.ruleset
        }
        url = reverse("rule-similarity",
                      kwargs={"dataset_id": self.dataset_id})

        self.client.force_authenticate(another_user)
        response: Response = self.client.put(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


def test_invalid_measure(self):
    """
    Test if providing an invalid measure returns an error.
    """
    payload = {
        "similarity_type": "semantic",
        "measure": "InvalidMeasure",
        "ruleset_1": self.ruleset.ruleset,
        "ruleset_2": self.ruleset.ruleset
    }
    url = reverse("rule-similarity", kwargs={"dataset_id": self.dataset_id})

    self.client.force_authenticate(self.user)
    response: Response = self.client.put(url, payload, format='json')

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    response_data = response.json()
    self.assertIn("error_message_key", response_data)
