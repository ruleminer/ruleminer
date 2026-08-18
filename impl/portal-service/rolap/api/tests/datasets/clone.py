import pandas as pd
from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models import Dataset
from rolap.api.models import DatasetAttributes
from rolap.api.models import ImportanceResults
from rolap.api.models import PredictionResults
from rolap.api.models import Project
from rolap.api.models import Rules
from rolap.api.models import Ruleset


class DatasetCloneTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project: Project = Project.objects.create(
            name='Test Project', description='This is a test project.',
            type_of_problem='classification', owner=self.user,
        )
        self.dataset: Dataset = Dataset.objects.create(
            name='Test dataset 1', project=self.project)
        df = pd.DataFrame(
            {
                "name": ["A", "B", "C", "D", "E"],
                "age": [1, 2, 3, 4, 5]
            }
        )
        self.dataset.write_dataset_to_storage(df)
        self.attribute1 = DatasetAttributes.objects.create(
            name="name", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.CATEGORICAL, role=DatasetAttributes.DataAttributeRoles.CLASSIFICATION, unique_values=[
                "A", "B", "C", "D", "E"],
        )
        self.attribute2 = DatasetAttributes.objects.create(
            name="age", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE, min=1, max=5, average=3,
        )
        self.ruleset = Ruleset.objects.create(
            name='Test ruleset 1', attached_to_dataset=self.dataset)
        self.rule1 = Rules.objects.create(ruleset=self.ruleset, indicators={})
        self.rule2 = Rules.objects.create(ruleset=self.ruleset, indicators={})
        self.importance_result = ImportanceResults.objects.create(
            ruleset=self.ruleset, condition_importance={}, attribute_importance={}
        )
        self.prediction_result = PredictionResults.objects.create(
            dataset=self.dataset, ruleset=self.ruleset, results={}
        )

    def test_clone_dataset(self):
        url = reverse("dataset_clone", kwargs={
            "dataset_id": self.dataset.pk})
        self.client.force_authenticate(self.user)
        response = self.client.post(
            url,
            {
                "name": "Test dataset duplicate",
                "description": "About test dataset duplicate",
            }
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_dataset_id = response.data["dataset_id"]
        self.assertNotEqual(new_dataset_id, self.dataset.pk)
        new_dataset = Dataset.objects.get(pk=new_dataset_id)
        self.assertEqual(new_dataset.attached_rulesets.count(), 0)

    def test_clone_dataset_with_rulesets(self):
        url = reverse("dataset_clone", kwargs={
            "dataset_id": self.dataset.pk})
        self.client.force_authenticate(self.user)
        response = self.client.post(
            url,
            {
                "name": "Test dataset duplicate",
                "description": "About test dataset duplicate",
                "clone_related": True,
            }
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_dataset_id = response.data["dataset_id"]
        self.assertNotEqual(new_dataset_id, self.dataset.pk)
        new_dataset = Dataset.objects.get(pk=new_dataset_id)
        self.assertEqual(new_dataset.attached_rulesets.count(),
                         self.dataset.attached_rulesets.count())
        self.assertEqual(new_dataset.attached_rulesets.first(
        ).rules.count(), self.ruleset.rules.count())
        self.assertNotEqual(
            new_dataset.attached_rulesets.first().pk, self.ruleset.pk)
        self.assertNotEqual(new_dataset.attached_rulesets.first(
        ).rules.first().pk, self.ruleset.rules.first().pk)

    def test_clone_forbidden(self):
        url = reverse("dataset_clone", kwargs={
            "dataset_id": self.dataset.pk})
        self.user._permissions = []
        self.client.force_authenticate(self.user)
        response = self.client.post(
            url,
            {
                "name": "Test dataset duplicate",
                "description": "About test dataset duplicate",
            }
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_clone_wrong_data(self):
        url = reverse("dataset_clone", kwargs={
            "dataset_id": self.dataset.pk})
        self.client.force_authenticate(self.user)
        response = self.client.post(
            url,
            {
                "description": "About test dataset duplicate",
            }
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_clone_dataset_same_name(self):
        url = reverse("dataset_clone", kwargs={
            "dataset_id": self.dataset.pk})
        self.client.force_authenticate(self.user)
        response = self.client.post(
            url,
            {
                "name": self.dataset.name,
                "description": "About test dataset duplicate",
            }
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
