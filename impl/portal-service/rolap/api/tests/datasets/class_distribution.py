import pandas as pd
from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models import Dataset
from rolap.api.models import DatasetAttributes
from rolap.api.models import Project


class DatasetClassDistributionTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project: Project = Project.objects.create(
            name='Test Project', description='This is a test project.',
            type_of_problem=Project.CLASSIFICATION, owner=self.user,
        )
        self.cls_distribution = {
            "X": 3,
            "Y": 2
        }
        self.dataset: Dataset = Dataset.objects.create(
            name='Test dataset 1', project=self.project, class_distribution=self.cls_distribution)
        self.df = pd.DataFrame(
            {
                "name": ["A", "B", "C", "D", "E"],
                "age": [1, 2, 3, 4, 5],
                "class": ["X", "Y", "X", "Y", "X"],
            }
        )
        self.dataset.write_dataset_to_storage(self.df)
        self.attribute1 = DatasetAttributes.objects.create(
            name="name", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.CATEGORICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE,
            unique_values=["A", "B", "C", "D", "E"],
        )
        self.attribute2 = DatasetAttributes.objects.create(
            name="age", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE,
            min=1, max=5, average=3,
        )
        self.attribute3 = DatasetAttributes.objects.create(
            name="class", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.CATEGORICAL, role=DatasetAttributes.DataAttributeRoles.CLASSIFICATION,
            unique_values=["X", "Y"],
        )

    def test_get_class_distribution(self):
        url = reverse("dataset_class_distribution", kwargs={
            "dataset_id": self.dataset.pk})
        expected_distribution = self.cls_distribution
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, expected_distribution)

    def test_get_class_distribution_wrong_type(self):
        url = reverse("dataset_class_distribution", kwargs={
            "dataset_id": self.dataset.pk})
        self.project.type_of_problem = Project.REGRESSION
        self.project.save()
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
