import io

import numpy as np
import pandas as pd
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files import File
from django.test import TestCase
from rest_framework.test import APIClient
from rolap.api.models import LimitGroup
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import UploadDatasetRequest
from rolap.api.models.projects import Project
from rolap.api.utils.factories.new_dataset_creator import NewDatasetCreator
from rolap.api.utils.limits import UserLimits

User = get_user_model()


class NewDatasetCreatorTestCase(TestCase):

    def setUp(self):
        N: int = 10
        self.df = pd.DataFrame({
            '0': np.random.randint(0, 100, N),
            '1': np.random.randint(0, 100, N),
            '2': np.random.randint(0, 100, N),
            '3': np.random.randint(0, 100, N),
            '4': np.random.randint(0, 100, N),
            '5': np.random.randint(0, 100, N),
            '6': np.random.randint(0, 100, N),
            'class': np.random.randint(0, 2, N).astype(str),
        })
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1',
            username='testuser',
            email='testuser@test.com',
            password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE, "storage_basic"]
        self.limit_group = LimitGroup.objects.create(
            name="storage_basic",
            max_rows=N,
            max_columns=self.df.shape[1],
            max_size=100 * 1024,
            max_sum_size=1000 * 1024,
            max_projects=10,
            max_datasets=10,
            max_rulesets=10,
            max_reports=10,

        )
        self.limits = UserLimits(self.user)
        self.classification_project: Project = Project.objects.create(
            name='Test Classification Project',
            description='This is a test project.',
            type_of_problem=Project.CLASSIFICATION,
            owner=self.user,
        )
        df_file = io.BytesIO()
        self.df.to_csv(df_file, index=False)
        df_file.seek(0)
        self.df_file = File(df_file, 'test.csv')

    def test_column_selection(self):
        request: UploadDatasetRequest = UploadDatasetRequest(
            name='Test dataset 1',
            file=self.df_file,
            selected_columns=[1, 2, 5, 6, 7],
            assigned_column_classes=["attr", "attr", "attr", "attr", "class"],
            assigned_column_types=["num", "num", "num", "num", "cat"],
            delimiter=',',
            decimal_separator='.',
            missing_value_sign=None,
            encoding='utf-8',
            description='This is a test dataset.',
            header=True
        )
        creator = NewDatasetCreator(
            request,
            self.classification_project,
            self.limits
        )
        creator.create_new_dataset()


# python manage.py test rolap.api.tests.datasets.new_dataset_creator --testrunner="rolap.test_runner.APITestRunner" --settings=rolap.settings.local
# python manage.py test rolap.api.tests --testrunner="rolap.test_runner.APITestRunner" --settings=rolap.settings.local
