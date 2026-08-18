import json

from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.projects import Project


class DatasetAttributesSetup(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project: Project = Project.objects.create(
            name='Test Project', description='This is a test project.',
            type_of_problem='classification', owner=self.user,
        )
        self.dataset1: Dataset = Dataset.objects.create(
            name='Test dataset 1', project=self.project)
        self.dataset2: Dataset = Dataset.objects.create(
            name='Test dataset 2', project=self.project)
        self.attribute11 = DatasetAttributes.objects.create(
            name="attr1", dataset=self.dataset1, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.CATEGORICAL,
            unique_values=["A", "B", "C"],
            role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE,
        )
        self.attribute12 = DatasetAttributes.objects.create(
            name="attr2", dataset=self.dataset1, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL,
            role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE,
        )


class DatasetsAttributesViewTestCase(DatasetAttributesSetup):
    def test_invalid_project_id(self):
        url = reverse(
            "project-tree",
            kwargs={"id": self.project.id + 1},
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_dataset_attributes_view(self):
        url = reverse(
            "dataset-attributes",
            kwargs={"dataset_id": self.dataset1.pk},
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        expected_results = [
            {
                "id": self.attribute11.pk,
                "name": self.attribute11.name,
                "type": self.attribute11.type,
                "role": self.attribute11.role,
            },
            {
                "id": self.attribute12.pk,
                "name": self.attribute12.name,
                "type": self.attribute12.type,
                "role": self.attribute12.role,
            }
        ]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, expected_results)

    def test_dataset_attributes_view_nonexistent(self):
        url = reverse(
            "dataset-attributes",
            kwargs={"dataset_id": self.dataset1.pk + 5},
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_dataset_attributes_unauthorized(self):
        url = reverse(
            "dataset-attributes",
            kwargs={"dataset_id": self.dataset1.pk},
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dataset_attributes_wrong_user(self):
        another_user: User = User.objects.create_user(
            keycloak_id='2', username='another_user', email='testuser2@test.com', password='testpass'
        )
        another_user._permissions = [settings.KEYCLOAK_USER_ROLE]
        url = reverse(
            "dataset-attributes",
            kwargs={"dataset_id": self.dataset1.pk},
        )
        self.client.force_authenticate(another_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_dataset_attributes_forbidden(self):
        url = reverse(
            "dataset-attributes",
            kwargs={"dataset_id": self.dataset1.pk},
        )
        self.user._permissions = []
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DatasetAcceptedAttributeTypesViewTestCase(DatasetAttributesSetup):
    def test_get_accepted_attributes(self):
        url = reverse("dataset-accepted-attribute-types")
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        types = json.loads(response.content)["types"]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(set(types), set(DatasetAttributes.DataAttributeTypes))


class DatasetNominalValuesViewTestCase(DatasetAttributesSetup):
    def test_get_nominal_attribute_values(self):
        url = reverse(
            "dataset-nominal-attrs-values",
            kwargs={"dataset_id": self.dataset1.pk},
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.attribute11.unique_values,
                         content[self.attribute11.name])


class UnimportantAttributesViewTests(DatasetAttributesSetup):

    def setUp(self):
        super().setUp()
        self.dataset1.unimportant_attributes = {
            'ID-ness': ["attr1", "attr3"],
            'Stability': ["attr2"],
            'Text-ness': ["attr2"]
        }
        self.dataset1.save()

    def test_retrieve_unimportant_attributes_for_existing_dataset(self):
        url = reverse('unimportant_attributes', args=[self.dataset1.id])
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, self.dataset1.unimportant_attributes)

    def test_retrieve_unimportant_attributes_for_empty_field(self):
        url = reverse('unimportant_attributes', args=[self.dataset2.id])
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, None)
