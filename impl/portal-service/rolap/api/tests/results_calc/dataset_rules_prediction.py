import io
import json

import pandas as pd
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase
from rolap.api.utils.http import IndicatorHttpService


class TestDatasetRulesPredictionView(RulesetAbstractTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse('prediction-on-uploaded', kwargs={
                           'dataset_id': self.dataset_id})
        self.data = {
            'dataset_info': {
                'delimiter': ',',
                'decimal_separator': '.',
                'encoding': 'utf-8',
                'missing_value_sign': ''
            },
            'ruleset_info': {
                'ruleset': self.ruleset.ruleset,
                "rule_coverage": {
                    self.rule1.uuid: {
                        "p": self.rule1.p,
                        "n": self.rule1.n
                    },
                    self.rule2.uuid: {
                        "p": self.rule2.p,
                        "n": self.rule2.n
                    },
                    self.rule3.uuid: {
                        "p": self.rule3.p,
                        "n": self.rule3.n
                    }
                },
                'original_ruleset_id': self.ruleset.id
            }
        }

    def test_successful_prediction(self):
        original_calculate_prediction = IndicatorHttpService.calculate_prediction
        IndicatorHttpService.calculate_prediction = lambda self, request: [
            "1", "2", "3"]

        try:
            file_data = b'name,age\nA,1\nB,2\nC,3'
            file = SimpleUploadedFile(
                "test.csv", file_data, content_type="multipart/form-data")

            response = self.client.put(
                self.url, data={'file': file, 'data': json.dumps(self.data)}, format='multipart')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = io.StringIO(response.getvalue().decode("utf-8"))
            returned_df = pd.read_csv(data)
            self.assertIn("name", returned_df.columns)
            self.assertIn("prediction", returned_df.columns)
            self.assertTrue(
                all(item in returned_df['prediction'].tolist() for item in [1, 2, 3]))
            expected_header = f'attachment; filename="prediction_results.csv"'
            self.assertEqual(
                response.headers['Content-Disposition'], expected_header)
        finally:
            IndicatorHttpService.calculate_prediction = original_calculate_prediction

    def test_no_file_provided(self):
        response = self.client.put(
            self.url, data={'data': json.dumps(self.data)}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_columns(self):
        file_data = b'WRONG,age\nA,B,C,1,2,3'
        file = SimpleUploadedFile(
            "invalid.csv", file_data, content_type="multipart/form-data")

        response = self.client.put(
            self.url, data={'file': file, 'data': json.dumps(self.data)}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inconsistent_types(self):
        file_data = b'name,age\nA,1\nB,?\nC,3'
        file = SimpleUploadedFile(
            "test.csv", file_data, content_type="multipart/form-data")

        self.data['dataset_info']['decimal_separator'] = ','
        response = self.client.put(
            self.url, data={'file': file, 'data': json.dumps(self.data)}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
