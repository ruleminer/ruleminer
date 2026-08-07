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
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase


class RulesetTestCases(RulesetAbstractTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_get_all_rulesets_result(self):
        url = reverse("all-rulesets",
                      kwargs={
                          "dataset_id": self.dataset_id
                      })

        self.client.force_authenticate(self.user)
        response = self.client.get(
            url
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_ruleset_details_result(self):
        url = reverse("ruleset-detail",
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
        self.assertIn("rules", content)
        self.assertIn("meta", content)

    def test_delete_ruleset_result(self):
        url = reverse("ruleset-detail",
                      kwargs={
                          "dataset_id": self.dataset_id,
                          "ruleset_id": self.ruleset.id
                      })

        self.client.force_authenticate(self.user)
        response = self.client.delete(
            url
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class RulesetDetailEditViewTest(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id="1", username="testuser", email="testuser@test.com", password="testpass"
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project: Project = Project.objects.create(
            name="Test Project", description="This is a test project.", type_of_problem="classification",
            owner=self.user
        )
        self.dataset: Dataset = Dataset.objects.create(
            name="Test dataset 1", delimiter=",", project=self.project, path="550e8400-e29b-41d4-a716-446655440000"
        )
        self.ruleset: Ruleset = Ruleset.objects.create(
            name="Test ruleset", description="This is a test ruleset.", attached_to_dataset=self.dataset
        )

    def test_get_ruleset_detail(self):
        url = reverse("ruleset-object-detail",
                      kwargs={"dataset_id": self.dataset.id, "ruleset_id": self.ruleset.id})
        self.client.force_authenticate(self.user)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["description"], self.ruleset.description)

    def test_update_ruleset_detail(self):
        url = reverse("ruleset-object-detail",
                      kwargs={"dataset_id": self.dataset.id, "ruleset_id": self.ruleset.id})
        self.client.force_authenticate(self.user)

        updated_data = {"description": "Updated ruleset description"}
        response = self.client.patch(url, data=updated_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ruleset.refresh_from_db()
        self.assertEqual(self.ruleset.description, updated_data["description"])

    def test_update_ruleset_detail_wrong_name(self):
        url = reverse("ruleset-object-detail",
                      kwargs={"dataset_id": self.dataset.id, "ruleset_id": self.ruleset.id})
        self.client.force_authenticate(self.user)
        updated_data = {"name": "Ruleset: wrong name"}
        response = self.client.patch(url, data=updated_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_nonexistent_ruleset_detail(self):
        url = reverse("ruleset-object-detail",
                      kwargs={"dataset_id": self.dataset.id, "ruleset_id": 9999})
        self.client.force_authenticate(self.user)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class RulesetCommentViewTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id="1", username="testuser", email="testuser@test.com", password="testpass"
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project: Project = Project.objects.create(
            name="Test Project", description="This is a test project.", type_of_problem="survival", owner=self.user
        )
        self.dataset: Dataset = Dataset.objects.create(
            name="Test dataset 1", delimiter=",", project=self.project, path=uuid.uuid4(),
        )
        self.ruleset: Ruleset = Ruleset.objects.create(
            name="Test ruleset", description="This is a test ruleset.", attached_to_dataset=self.dataset,
            comments=[
                {
                    "code": "non_covering_rules_removed",
                    "context": [{
                        "uuid": "3392f759-d865-4b04-909a-ef93cf03c79e",
                        "string": "IF PLT_recovery >= 500,142.50 AND extensive_chronic_GvHD != {no} THEN survival_status = {42.0}",
                        "premise": {
                            "type": "compound",
                            "negated": False,
                            "operator": "CONJUNCTION",
                            "attributes": [
                                33,
                                29
                            ],
                            "subconditions": [
                                {
                                    "left": 500142.5,
                                    "type": "elementary_numerical",
                                    "right": None,
                                    "negated": False,
                                    "attributes": [
                                        29
                                    ],
                                    "left_closed": True,
                                    "right_closed": False
                                },
                                {
                                    "type": "elementary_nominal",
                                    "value": "no",
                                    "negated": True,
                                    "attributes": [
                                        33
                                    ]
                                }
                            ]
                        },
                        "coverage": None,
                        "conclusion": {
                            "value": 42.0,
                            "estimator": None,
                            "median_survival_time_ci_lower": 11.0,
                            "median_survival_time_ci_upper": 60.0
                        },
                        "voting_weight": None
                    }],
                }
            ]
        )

    def test_view_ruleset_comments(self):
        url = reverse("ruleset-comments",
                      kwargs={"dataset_id": self.dataset.id, "ruleset_id": self.ruleset.id})
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["comments"], self.ruleset.comments)

    def test_update_ruleset_comments(self):
        url = reverse("ruleset-comments",
                      kwargs={"dataset_id": self.dataset.id, "ruleset_id": self.ruleset.id})
        self.client.force_authenticate(self.user)
        updated_comments = []
        response = self.client.patch(
            url, data={"comments": updated_comments}, format="json")
        self.ruleset.refresh_from_db(fields=["comments"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.ruleset.comments, updated_comments)
