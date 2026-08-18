import pandas as pd
from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models import Dataset
from rolap.api.models import DatasetAttributes
from rolap.api.models import Project


class KaplanMeierViewTestCase(APITestCase):
    def test_get_kaplan_meier_estimator(self):
        url = reverse("dataset_kaplan_meier_estimator", args=[self.dataset.id])
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("time", response.data)
        self.assertIn("events_count", response.data)
        self.assertIn("censored_count", response.data)
        self.assertIn("at_risk_count", response.data)
        self.assertIn("probability", response.data)

    def test_get_kaplan_meier_estimator_wrong_project(self):
        url = reverse("dataset_kaplan_meier_estimator",
                      args=[self.wrong_dataset.id])
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["err_msg_id"],
                         "unsupported_problem_type_error")

    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project = Project.objects.create(
            name="Test survival project",
            type_of_problem=Project.SURVIVAL,
            owner=self.user,
        )
        self.dataset = Dataset.objects.create(
            name="Test dataset",
            project=self.project,
        )
        self.time_attr = DatasetAttributes.objects.create(
            dataset=self.dataset,
            name="survival_time",
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL,
            role=DatasetAttributes.DataAttributeRoles.SURVIVAL_TIME,
            missing_values_count=0,
        )
        self.status_attr = DatasetAttributes.objects.create(
            dataset=self.dataset,
            name="survival_status",
            type=DatasetAttributes.DataAttributeTypes.CATEGORICAL,
            role=DatasetAttributes.DataAttributeRoles.CLASSIFICATION,
            missing_values_count=0,
        )
        self.attr = DatasetAttributes.objects.create(
            dataset=self.dataset,
            name="attr",
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL,
            role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE,
            missing_values_count=0,
        )
        df = pd.DataFrame(
            {
                "survival_time": [1, 2, 3, 4, 5],
                "survival_status": [1, 1, 0, 1, 0],
                "attr": [1, 2, 3, 4, 5],
            }
        )
        self.dataset.write_dataset_to_storage(df)
        self.wrong_project = Project.objects.create(
            name="Test classification project",
            type_of_problem=Project.CLASSIFICATION,
            owner=self.user,
        )
        self.wrong_dataset = Dataset.objects.create(
            name="Test dataset",
            project=self.wrong_project,
        )
