import io
import json
from datetime import timedelta

import numpy as np
import pandas as pd
from django.conf import settings
from django.test import override_settings
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models import Dataset
from rolap.api.models import DatasetAttributes
from rolap.api.models import LimitGroup
from rolap.api.models import Project
from rolap.api.models import Subscription

TEST_LIMITS = {
    "max_rows": 1,
    "max_columns": 1,
    "max_size": 1 * 1024,  # 1 kB
    "max_sum_size": 10 * 1024,  # 10 kB
    "max_projects": 10,
    "max_datasets": 10,
    "max_rulesets": 10,
    "max_reports": 10,
}


@override_settings(DEFAULT_DATASET_LIMITS=TEST_LIMITS)
class DatasetUploadTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE, "storage_basic"]
        self.limit_group = LimitGroup.objects.create(
            name="storage_basic",
            max_rows=5,
            max_columns=5,
            max_size=100 * 1024,
            max_sum_size=1000 * 1024,
            max_projects=10,
            max_datasets=10,
            max_rulesets=10,
            max_reports=10,
        )
        start_date = timezone.now().date()
        expiration_date = start_date + timedelta(days=30)
        Subscription.objects.create(
            user=self.user,
            limit_group=self.limit_group,
            subscription_id="sub_id",
            start_date=start_date,
            expiration_date=expiration_date,
            email="example@gmail.com",
        )
        self.classification_project: Project = Project.objects.create(
            name='Test Classification Project', description='This is a test project.',
            type_of_problem=Project.CLASSIFICATION, owner=self.user,
        )
        self.regression_project: Project = Project.objects.create(
            name='Test Regression Project', description='This is a test project.',
            type_of_problem=Project.REGRESSION, owner=self.user,
        )
        self.survival_project: Project = Project.objects.create(
            name='Test Survival Project', description='This is a test project.',
            type_of_problem=Project.SURVIVAL, owner=self.user,
        )
        self.classification_test_df = pd.DataFrame(
            {
                "name": ["A", "B", "C"],
                "age": [1, 2, 3],
                "height": [1.80, 1.70, 1.60],
                "is_active": [True, False, True],
            }
        )
        self.regression_test_df = pd.DataFrame(
            {
                "name": ["A", "B", "C"],
                "age": [1, 2, 3],
                "height": [1.80, 1.70, 1.60],
                "is_active": [True, False, True],
            }
        )
        self.survival_test_df = pd.DataFrame(
            {
                "name": ["A", "B", "C"],
                "survival_time": [1, 2, 3],
                "height": [1.80, 1.70, 1.60],
                "is_active": [True, False, True],
                "survival_status": ['1.0', '0.0', '1.0']
            }
        )
        self.classification_body_data = {
            "name": "new dataset",
            "description": "its description",
            "delimiter": ";",
            "decimal_separator": ",",
            "selected_columns": [0, 1, 2, 3],
            "assigned_column_types": ["cat", "num", "num", "cat"],
            "assigned_column_classes": ["attr", "attr", "attr", "class"],
            "missing_value_sign": "nan",
            "encoding": "UTF-8",
        }
        self.regression_body_data = {
            "name": "new dataset",
            "description": "its description",
            "delimiter": ";",
            "decimal_separator": ",",
            "selected_columns": [0, 1, 2, 3],
            "assigned_column_types": ["cat", "num", "num", "cat"],
            "assigned_column_classes": ["attr", "class", "attr", "attr"],
            "missing_value_sign": "nan",
            "encoding": "UTF-8",
        }
        self.survival_body_data = {
            "name": "new dataset",
            "description": "its description",
            "delimiter": ";",
            "decimal_separator": ".",
            "selected_columns": [0, 1, 2, 3, 4],
            "assigned_column_types": ["cat", "num", "num", "cat", "cat"],
            "assigned_column_classes": ["attr", "survival_time", "attr", "attr", "class"],
            "missing_value_sign": "nan",
            "encoding": "UTF-8",
        }

    def _make_body(self, df: pd.DataFrame, codec="utf-8") -> io.BytesIO:
        file = io.BytesIO()
        df.to_csv(file, sep=";", decimal=".", index=False, encoding=codec)
        file.seek(0)
        return file

    def test_upload(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        file = self._make_body(self.classification_test_df)
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart"
        )
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("dataset_id", content)

    def test_upload_name_exists(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        Dataset.objects.create(
            project=self.classification_project, name=self.classification_body_data["name"],
        )
        file = self._make_body(self.classification_test_df)
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["err_msg_id"], "dataset_exists")

    def test_upload_wrong_body(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        file = self._make_body(self.classification_test_df)
        self.classification_body_data["selected_columns"].append(5)
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_wrong_separator(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        file = self._make_body(self.classification_test_df)
        self.classification_body_data["delimiter"] = ","
        self.classification_body_data["decimal_separator"] = "."
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_file_too_large(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        large_df = pd.concat([self.classification_test_df] * 10000, axis=0)
        file = self._make_body(large_df)
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["err_msg_id"], "max_size_limit_exceeded")

    def test_upload_row_limit_exceeded(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        large_df = pd.concat(
            [self.classification_test_df, self.classification_test_df], axis=0)
        file = self._make_body(large_df)
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["err_msg_id"], "max_rows_limit_exceeded")

    def test_upload_column_limit_exceeded(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        large_df = pd.concat(
            [self.classification_test_df, self.classification_test_df], axis=1)
        large_df.columns = [f"col_{i}" for i in range(len(large_df.columns))]
        self.classification_body_data["selected_columns"] = list(
            range(len(large_df.columns)))
        file = self._make_body(large_df)
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["err_msg_id"],
                         "max_columns_limit_exceeded")

    def test_upload_unauthorized(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        file = self._make_body(self.classification_test_df)
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_upload_max_datasets_exceeded(self):
        self.limit_group.max_datasets = 0
        self.limit_group.save()
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        file = self._make_body(self.classification_test_df)
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart"
        )
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(content["err_msg_id"], "datasets_limit_reached")

    def test_no_class(self):
        data = {
            "name": "new dataset",
            "description": "its description",
            "delimiter": ";",
            "decimal_separator": ",",
            "selected_columns": [1, 2, 3, 4],
            "assigned_column_types": ["cat", "num", "num", "cat"],
            "assigned_column_classes": ["attr", "attr", "attr", "attr"],
            "missing_value_sign": "nan",
            "encoding": "utf-8",
        }

        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        file = self._make_body(self.classification_test_df)
        response = self.client.put(
            url,
            data={"data": json.dumps(data), "file": file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_codecs(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        codecs = settings.ALLOWED_CODECS
        for codec in codecs:
            file = self._make_body(self.classification_test_df, codec)
            self.classification_body_data["name"] = f"new dataset {codec}"
            self.classification_body_data["encoding"] = codec
            response = self.client.put(
                url,
                data={"data": json.dumps(
                    self.classification_body_data), "file": file},
                format="multipart"
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK,
                             f"Does not work for codec {codec}.")

    def test_upload_wrong_codec(self):
        url = reverse("upload_dataset", kwargs={
            "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        codec = "utf-16"
        file = self._make_body(self.classification_test_df, codec)
        self.classification_body_data["name"] = f"new dataset {codec}"
        self.classification_body_data["encoding"] = codec
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_no_header(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        file = io.BytesIO()
        self.classification_test_df.to_csv(file, header=False, sep=";",
                                           decimal=",", index=False, encoding="utf-8")
        file.seek(0)
        self.classification_body_data["header"] = False
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart"
        )
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("dataset_id", content)
        attributes = Dataset.objects.get(
            pk=content["dataset_id"]).attributes.values_list("name", flat=True)
        self.assertEqual(set(attributes), {
                         "Column_1", "Column_2", "Column_3", "Class"})

    def test_upload_too_few_columns(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        file = self._make_body(self.classification_test_df[["name", "age"]])
        self.classification_body_data["selected_columns"] = [0, 1]
        self.classification_body_data["assigned_column_types"] = ["cat", "num"]
        self.classification_body_data["assigned_column_classes"] = [
            "attr", "attr"]
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["err_msg_id"],
                         "no_label_attribute_specified")

    def test_upload_empty_df(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        file = self._make_body(self.classification_test_df[:0])
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["err_msg_id"], "empty_dataset")

    def test_upload_empty_file(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        file = self._make_body(pd.DataFrame())
        response = self.client.put(
            url,
            data={"data": json.dumps(
                self.classification_body_data), "file": file},
            format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["err_msg_id"], "empty_dataset")

    def test_classification_upload_for_invalid_label_type(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)

        # set label attribute as numerical attribute
        for i, role in enumerate(self.classification_body_data['assigned_column_classes']):
            if role == DatasetAttributes.DataAttributeRoles.CLASSIFICATION:
                self.classification_body_data['assigned_column_types'][i] = DatasetAttributes.DataAttributeTypes.NUMERICAL
                break

        response = self.client.put(
            url,
            data={
                "data": json.dumps(self.classification_body_data),
                "file": self._make_body(self.classification_test_df)
            },
            format="multipart"
        )
        self.assertEqual(
            response.data["err_msg_id"], 'invalid_attribute_type_error'
        )

    def test_classification_upload_for_invalid_label_values(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)

        # set all labels for the same value
        df = self.classification_test_df.copy()
        df.loc[:, 'is_active'] = False

        response = self.client.put(
            url,
            data={
                "data": json.dumps(self.classification_body_data),
                "file": self._make_body(df)
            },
            format="multipart"
        )
        self.assertEqual(
            response.data["err_msg_id"], 'invalid_label_column_values',
            msg='Classification dataset upload should fail for label column with a single unique value.'
        )

        # set empty value as label
        df = self.classification_test_df.copy()
        df['is_active'] = df['is_active'].astype(int)
        df.loc[0, 'is_active'] = None

        response = self.client.put(
            url,
            data={
                "data": json.dumps(self.classification_body_data),
                "file": self._make_body(df)
            },
            format="multipart"
        )
        self.assertEqual(
            response.data["err_msg_id"], 'empty_label_column_values',
            msg='Classification dataset upload should fail for label column containing empty values.'
        )

    def test_regression_upload_for_invalid_label_type(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.regression_project.pk})
        self.client.force_authenticate(self.user)

        # set label attribute as categorical attribute
        for i, role in enumerate(self.regression_body_data['assigned_column_classes']):
            if role == DatasetAttributes.DataAttributeRoles.CLASSIFICATION:
                self.regression_body_data['assigned_column_types'][i] = DatasetAttributes.DataAttributeTypes.CATEGORICAL
                break

        response = self.client.put(
            url,
            data={
                "data": json.dumps(self.regression_body_data),
                "file": self._make_body(self.regression_test_df)
            },
            format="multipart"
        )
        self.assertEqual(
            response.data["err_msg_id"], 'invalid_attribute_type_error'
        )

    def test_survival_upload_for_invalid_label_type(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.survival_project.pk})
        self.client.force_authenticate(self.user)

        for i, role in enumerate(self.survival_body_data['assigned_column_classes']):
            if role == DatasetAttributes.DataAttributeRoles.CLASSIFICATION:
                survival_status_index = i
            if role == DatasetAttributes.DataAttributeRoles.SURVIVAL_TIME:
                survival_time_index = i

        # set survival_status attribute as numerical attribute
        self.survival_body_data['assigned_column_types'][survival_status_index] = DatasetAttributes.DataAttributeTypes.NUMERICAL
        response = self.client.put(
            url,
            data={
                "data": json.dumps(self.survival_body_data),
                "file": self._make_body(self.survival_test_df)
            },
            format="multipart"
        )
        self.assertEqual(
            response.data["err_msg_id"], 'invalid_attribute_type_error'
        )
        self.assertEqual(
            response.data['detail']["attribute_role"],  DatasetAttributes.DataAttributeRoles.CLASSIFICATION
        )
        # restore original type
        self.survival_body_data['assigned_column_types'][survival_status_index] = DatasetAttributes.DataAttributeTypes.CATEGORICAL

        # set survival_time attribute as categorical attribute
        self.survival_body_data['assigned_column_types'][survival_time_index] = DatasetAttributes.DataAttributeTypes.CATEGORICAL
        response = self.client.put(
            url,
            data={
                "data": json.dumps(self.survival_body_data),
                "file": self._make_body(self.survival_test_df)
            },
            format="multipart"
        )
        self.assertEqual(
            response.data["err_msg_id"], 'invalid_attribute_type_error'
        )
        self.assertEqual(
            response.data['detail']["attribute_role"],  DatasetAttributes.DataAttributeRoles.SURVIVAL_TIME
        )

    def test_survival_upload_for_invalid_column_values(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.survival_project.pk})
        self.client.force_authenticate(self.user)

        # set survival_status for invalid values
        df = self.survival_test_df.copy()
        df.loc[0, 'survival_status'] = 'invalid'
        response = self.client.put(
            url,
            data={
                "data": json.dumps(self.survival_body_data),
                "file": self._make_body(df)
            },
            format="multipart"
        )
        self.assertEqual(
            response.json()["err_msg_id"], 'invalid_label_column_values',
            msg=(
                'Survival dataset upload should fail for survival_status ' +
                'column with values other than 0 and 1.'
            )
        )

        # set survival_time lower than 0
        df = self.survival_test_df.copy()
        df.loc[0, 'survival_time'] = -1.0
        response = self.client.put(
            url,
            data={
                "data": json.dumps(self.survival_body_data),
                "file": self._make_body(df)
            },
            format="multipart"
        )
        self.assertEqual(
            response.json()[
                "err_msg_id"], 'invalid_survival_time_column_values',
            msg=(
                'Survival dataset upload should fail for survival_time ' +
                'column with values lower than 0.'
            )
        )

        # set empty value in survival_time column - should work
        df = self.survival_test_df.copy()
        df.loc[0, 'survival_time'] = np.nan
        response = self.client.put(
            url,
            data={
                "data": json.dumps(self.survival_body_data),
                "file": self._make_body(df)
            },
            format="multipart"
        )
        self.assertEqual(
            response.json()["err_msg_id"], 'empty_survival_time_column_values',
            msg=(
                'Survival dataset upload should fail for survival_time ' +
                'column containing empty values.'
            )
        )

    def test_survival_upload_for_different_column_types(self):
        url = reverse("upload_dataset", kwargs={
                      "project_id": self.survival_project.pk})
        self.client.force_authenticate(self.user)
        # set survival_time as integer column - should work
        df = self.survival_test_df.copy()
        df['survival_status'] = df['survival_status'].astype(float).astype(int)
        self.survival_body_data['name'] = 'dataset with survival_status of integer type'
        response = self.client.put(
            url,
            data={
                "data": json.dumps(self.survival_body_data),
                "file": self._make_body(df)
            },
            format="multipart"
        )
        self.assertEqual(
            response.status_code, 200,
            msg='survival status column of integer type should be accepted'
        )

        # set survival_time as float column - should work
        df = self.survival_test_df.copy()
        df['survival_status'] = df['survival_status'].astype(float)
        self.survival_body_data['name'] = 'dataset with survival_status of float type'
        response = self.client.put(
            url,
            data={
                "data": json.dumps(self.survival_body_data),
                "file": self._make_body(df)
            },
            format="multipart"
        )
        self.assertEqual(
            response.status_code, 200,
            msg='survival status column of float type should be accepted'
        )

        # set survival_time as float string column - should work
        df = self.survival_test_df.copy()
        self.survival_body_data['name'] = 'dataset with survival_status of float strings'
        response = self.client.put(
            url,
            data={
                "data": json.dumps(self.survival_body_data),
                "file": self._make_body(df)
            },
            format="multipart"
        )
        self.assertEqual(
            response.status_code, 200,
            msg='survival status column of float strings should be accepted'
        )

    def test_classification_too_many_classes(self):
        url = reverse("upload_dataset", kwargs={
            "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        classification_test_df = pd.DataFrame(
            {
                "name": ["A", "B", "C"] * 34,
                "age": [1, 2, 3] * 34,
                "height": [1.80, 1.70, 1.60] * 34,
                "class": [str(i) for i in range(102)],
            }
        )
        response = self.client.put(
            url,
            data={
                "data": json.dumps(self.classification_body_data),
                "file": self._make_body(classification_test_df)
            },
            format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["err_msg_id"], 'too_many_classes'
        )

    def test_upload_empty_column(self):
        url = reverse("upload_dataset", kwargs={
            "project_id": self.classification_project.pk})
        self.client.force_authenticate(self.user)
        df = self.classification_test_df.copy()
        df["empty_col"] = [None, None, None]
        file = self._make_body(df)
        body_data = self.classification_body_data.copy()
        body_data["selected_columns"] = [0, 1, 2, 3, 4]
        body_data["assigned_column_types"] = [
            "cat", "num", "num", "cat", "cat"]
        body_data["assigned_column_classes"] = [
            "attr", "attr", "attr", "class", "attr"]
        response = self.client.put(
            url,
            data={"data": json.dumps(body_data), "file": file},
            format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["err_msg_id"], "empty_column")
        self.assertIn("column_names", response.data["detail"])
