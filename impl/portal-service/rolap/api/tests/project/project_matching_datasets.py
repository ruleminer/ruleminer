from copy import deepcopy

from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models import Dataset
from rolap.api.models import DatasetAttributes
from rolap.api.models import Project


class ProjectMatchingDatasetsViewTestCase(TestCase):

    dataset: Dataset
    attributes: list[DatasetAttributes]

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
            name='Test dataset 1', project=self.project, number_of_columns=3
        )
        self.attributes = [
            DatasetAttributes.objects.create(
                name="class", dataset=self.dataset, missing_values_count=0,
                type=DatasetAttributes.DataAttributeTypes.CATEGORICAL,
                role=DatasetAttributes.DataAttributeRoles.CLASSIFICATION, unique_values=[
                    "positive", "negative"
                ],
            ),
            DatasetAttributes.objects.create(
                name="cat_attr", dataset=self.dataset, missing_values_count=0,
                type=DatasetAttributes.DataAttributeTypes.CATEGORICAL,
                role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE, unique_values=[
                    "A", "B", "C", "D", "E"],
            ),
            DatasetAttributes.objects.create(
                name="num_attr", dataset=self.dataset, missing_values_count=0,
                type=DatasetAttributes.DataAttributeTypes.NUMERICAL,
                role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE
            )
        ]
        self.dataset_with_given_attributes_and_more = Dataset.objects.create(
            name='Dataset with given attributes and more', project=self.project,
            number_of_columns=4
        )
        self.dataset_with_given_attributes_and_more.save()
        for attr in self.attributes:
            attr = deepcopy(attr)
            attr.pk = None
            attr.dataset = self.dataset_with_given_attributes_and_more
            attr.save()
        DatasetAttributes.objects.create(
            name="num_attr2", dataset=self.dataset_with_given_attributes_and_more,
            missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL,
            role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE
        )

        self.dataset_with_wrong_attributes_types = Dataset.objects.create(
            name='Dataset with wrong attributes types', project=self.project,
            number_of_columns=4
        )
        self.dataset_with_wrong_attributes_types.save()
        for attr in self.attributes:
            attr = deepcopy(attr)
            attr.pk = None
            attr.type = (
                DatasetAttributes.DataAttributeTypes.CATEGORICAL
                if attr.type == DatasetAttributes.DataAttributeTypes.NUMERICAL else
                DatasetAttributes.DataAttributeTypes.NUMERICAL
            )
            attr.dataset = self.dataset_with_wrong_attributes_types
            attr.save()

        self.dataset_with_some_of_given_attributes = Dataset.objects.create(
            name='Dataset with some of the given attributes', project=self.project,
            number_of_columns=3
        )
        for attr in self.attributes[:-1]:  # remove last attribute
            attr = deepcopy(attr)
            attr.pk = None
            attr.dataset = self.dataset_with_some_of_given_attributes
            attr.save()
        DatasetAttributes.objects.create(
            name="num_attr2", dataset=self.dataset_with_some_of_given_attributes,
            missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL,
            role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE
        )

    def test_matching_datasets_default_case(self):
        """By default we should fetch all project datasets which have all desired
        attributes or possibly some others.
        """
        url = reverse(
            "project-matching-datasets",
            kwargs={"id": self.project.pk}
        )
        self.client.force_authenticate(self.user)
        response = self.client.post(
            url,
            {
                "dataset_id": self.dataset.pk
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data: dict = response.json()
        self.assertEqual(
            len(response_data), 2,
            'Should return two dataset'
        )
        self.assertTrue(
            self.dataset_with_given_attributes_and_more.pk in
            [e['id'] for e in response_data]
        )

    def test_matching_datasets_with_any_of_given_attributes(self):
        """Should fetch only datasets which attributes are subset of given attributes
        """
        url = reverse(
            "project-matching-datasets",
            kwargs={"id": self.project.pk}
        )
        self.client.force_authenticate(self.user)
        response = self.client.post(
            url,
            {
                "dataset_id": self.dataset.pk,
                "must_contain_all_given_attributes": False
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data: dict = response.json()
        self.assertEqual(
            len(response_data), 2,
            'Should return only one dataset'
        )
        self.assertTrue(
            self.dataset_with_some_of_given_attributes.pk in
            [e['id'] for e in response_data]
        )

    def test_get_matching_datasets_unauthorized(self):
        url = reverse("project-matching-datasets",
                      kwargs={"id": self.project.id})
        data = {
            "dataset_id": self.dataset.pk
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_dataset_with_different_target_column_name(self):
        url = reverse("project-matching-datasets",
                      kwargs={"id": self.project.id})
        target_attribute = self.dataset.attributes.filter(
            role=DatasetAttributes.DataAttributeRoles.CLASSIFICATION).get()
        target_attribute.name = "target"
        target_attribute.save()
        data = {
            "dataset_id": self.dataset.pk,
            "must_contain_all_given_attributes": False,
        }
        self.client.force_authenticate(self.user)
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
