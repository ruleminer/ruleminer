import io

import pandas as pd
from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.projects import Project
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase


class DatasetDownload(TestCase):
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
        self.df = pd.DataFrame(
            {
                "name": ["A", "B", "C", "D", "E"],
                "age": [1, 2, 3, 4, 5]
            }
        )
        self.dataset.write_dataset_to_storage(self.df)
        self.attribute1 = DatasetAttributes.objects.create(
            name="name", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.CATEGORICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE, unique_values=[
                "A", "B", "C", "D", "E"],
        )
        self.attribute2 = DatasetAttributes.objects.create(
            name="age", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE, min=1, max=5, average=3,
        )

    def test_download_dataset(self):
        url = reverse('download-dataset',
                      kwargs={'dataset_id': self.dataset.id})
        self.client.force_authenticate(self.user)

        request_data = {
            "name": "filtered_dataset",
            "columns": ["name"]
        }
        url_with_query = f"{url}?format_type=csv"
        response = self.client.put(url_with_query, data=request_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = io.StringIO(response.getvalue().decode("utf-8"))
        returned_df = pd.read_csv(data)
        self.assertIn("name", returned_df.columns)
        self.assertNotIn("age", returned_df.columns)
        expected_header = f'attachment; filename="{self.dataset.name}.csv"'
        self.assertEqual(
            response.headers['Content-Disposition'], expected_header)

    def test_download_dataset_xlsx(self):
        url = reverse('download-dataset',
                      kwargs={'dataset_id': self.dataset.id})
        self.client.force_authenticate(self.user)
        request_data = {
            "name": "filtered_dataset",
            "columns": ["name", "age"]
        }
        url_with_query = f"{url}?format_type=xlsx"
        response = self.client.put(url_with_query, data=request_data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = io.BytesIO()
        for chunk in response.streaming_content:
            data.write(chunk)
        data.seek(0)

        returned_df = pd.read_excel(data)
        self.assertIn("name", returned_df.columns)
        self.assertIn("age", returned_df.columns)
        expected_header = f'attachment; filename="{self.dataset.name}.xlsx"'
        self.assertEqual(
            response.headers['Content-Disposition'], expected_header)

    def test_download_dataset_bad_format(self):
        url = reverse('download-dataset',
                      kwargs={'dataset_id': self.dataset.id})
        self.client.force_authenticate(self.user)
        request_data = {
            "name": "filtered_dataset",
            "columns": ["name", "age"]
        }
        url_with_query = f"{url}?format_type=xl"
        response = self.client.put(url_with_query, data=request_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RulesetIndicatorsDownloadTestCase(RulesetAbstractTestCase):
    def test_download_ruleset_indicators(self):
        url = reverse('download-ruleset-indicators',
                      kwargs={'ruleset_id': self.ruleset.id})
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        data = io.StringIO(response.getvalue().decode("utf-8"))
        returned_df = pd.read_csv(data)
        header = response.headers['Content-Disposition']
        dataset = self.ruleset.attached_to_dataset
        expected_header = f'attachment; filename="{dataset.name}-{self.ruleset.name}-indicators.csv"'
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(header, expected_header)
        self.assertEqual(returned_df[returned_df["rule"] == self.rule1.uuid]["precision"].sum(
        ), self.rule1.indicators["precision"])
        self.assertEqual(returned_df[returned_df["rule"] == self.rule2.uuid]["precision"].sum(
        ), self.rule2.indicators["precision"])
        self.assertEqual(returned_df[returned_df["rule"] == self.rule3.uuid]["precision"].sum(
        ), self.rule3.indicators["precision"])


class RuleCoverageDownloadTestCase(RulesetAbstractTestCase):
    def test_download_ruleset_coverage(self):
        url = reverse('download-ruleset-coverage',
                      kwargs={'ruleset_id': self.ruleset.id})
        self.client.force_authenticate(self.user)
        request_data = {
            'ruleset': self.ruleset.ruleset
        }
        response = self.client.put(url, data=request_data, format='json')
        data = io.StringIO(response.getvalue().decode("utf-8"))
        returned_df = pd.read_csv(data)
        header = response.headers['Content-Disposition']
        dataset = self.ruleset.attached_to_dataset
        expected_header = f'attachment; filename="{dataset.name}-{self.ruleset.name}-coverage.csv"'
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(header, expected_header)
        rule_strings = [str(rule['string'])
                        for rule in self.ruleset.ruleset['rules']]
        for rule_string in rule_strings:
            self.assertIn(rule_string, returned_df.columns)


class DownloadRuleFilteredDatasetViewTestCase(RulesetAbstractTestCase):

    def test_download_rule_filtered_dataset_csv(self):
        url = reverse('download-rules-filtred-dataset',
                      kwargs={'dataset_id': self.dataset_id})
        request_data = {
            'name': 'filtered_dataset_csv',
            'ruleset': self.ruleset.ruleset
        }
        url_with_query = f"{url}?format_type=csv"
        response = self.client.put(
            url_with_query, data=request_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response['Content-Type'].startswith('text/csv'))

    def test_download_rule_filtered_dataset_xlsx(self):
        url = reverse('download-rules-filtred-dataset',
                      kwargs={'dataset_id': self.dataset_id})
        request_data = {
            'name': 'filtered_dataset_xlsx',
            'ruleset': self.ruleset.ruleset
        }
        url_with_query = f"{url}?format_type=xlsx"
        response = self.client.put(
            url_with_query, data=request_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_header = f'attachment; filename="test-filtered.xlsx"'
        self.assertEqual(
            response.headers['Content-Disposition'], expected_header)

    def test_download_rule_filtered_dataset_invalid_format(self):
        url = reverse('download-rules-filtred-dataset',
                      kwargs={'dataset_id': self.dataset_id})
        request_data = {
            'name': 'filtered_dataset_invalid',
            'ruleset': self.ruleset.ruleset
        }
        url_with_query = f"{url}?format_type=invalid_format"
        response = self.client.put(
            url_with_query, data=request_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DownloadImportanceViewTestCase(RulesetAbstractTestCase):

    def test_download_importance_csv(self):
        url = reverse('download-rules-importance',
                      kwargs={'ruleset_id': self.ruleset.id})
        response = self.client.get(url + '?format_type=csv')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response['Content-Type'].startswith('text/csv'))

    def test_download_importance_xlsx(self):
        url = reverse('download-rules-importance',
                      kwargs={'ruleset_id': self.ruleset.id})
        response = self.client.get(url + '?format_type=xlsx&importance_of=all')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_header = f'attachment; filename="test-{self.ruleset.name}-all-importance.xlsx"'
        self.assertEqual(
            response.headers['Content-Disposition'], expected_header)

    def test_download_importance_invalid_format(self):
        url = reverse('download-rules-importance',
                      kwargs={'ruleset_id': self.ruleset.id})
        response = self.client.get(url + '?format_type=invalid')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
