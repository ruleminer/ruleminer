import io
import json

import pandas as pd
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient
from rolap.api.models import Dataset
from rolap.api.models import Project


class CreateAndUploadTestCase(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = ["rolap_user"]
        self.user_without_projects: User = User.objects.create_user(
            keycloak_id='2', username='testuser2', email='testuser2@test.com', password='testpass2'
        )
        self.user_without_projects._permissions = ["rolap_user"]
        self.project_data: dict = {
            'name': 'Test post Project',
            'description': 'This is a post test project.',
            'type_of_problem': 'classification'
        }
        self.dataset_data = {
            "name": "new dataset",
            "description": "its description",
            "delimiter": ",",
            "decimal_separator": ".",
            "selected_columns": [0, 1, 2, 3],
            "assigned_column_types": ["cat", "num", "num", "cat"],
            "assigned_column_classes": ["attr", "attr", "attr", "class"],
            "missing_value_sign": "nan",
            "encoding": "utf-8",
        }
        self.test_df = pd.DataFrame(
            {
                "name": ["A", "B", "C"],
                "age": [1, 2, 3],
                "height": [1.80, 1.70, 1.60],
                "is_active": [True, False, True],
            }
        )
        self.data = {
            "project": self.project_data,
            "dataset": self.dataset_data,
        }

    def _make_body(self, df: pd.DataFrame) -> io.BytesIO:
        file = io.BytesIO()
        df.to_csv(file, sep=",", decimal=".", index=False)
        file.seek(0)
        return file

    def test_create_and_upload(self):
        self.client.force_authenticate(user=self.user)
        file = self._make_body(self.test_df)
        response: Response = self.client.post(
            reverse('create-project-and-upload-dataset'),
            data={"data": json.dumps(self.data), "file": file},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['project']
                         ['name'], self.project_data['name'])
        self.assertEqual(response.data['dataset']
                         ['name'], self.dataset_data['name'])
        self.assertEqual(Project.objects.last().name,
                         self.project_data['name'])
        self.assertEqual(Dataset.objects.last().name,
                         self.dataset_data['name'])

    def test_create_and_upload_project_exists(self):
        self.client.force_authenticate(user=self.user)
        Project.objects.create(
            name=self.project_data['name'],
            description=self.project_data['description'],
            type_of_problem=self.project_data['type_of_problem'],
            owner=self.user
        )
        file = self._make_body(self.test_df)
        response: Response = self.client.post(
            reverse('create-project-and-upload-dataset'),
            data={"data": json.dumps(self.data), "file": file},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["err_msg_id"], "project_exists")
