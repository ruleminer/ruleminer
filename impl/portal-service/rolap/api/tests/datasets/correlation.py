import json

import pandas as pd
from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rolap.api.tests.datasets.rulesets import BaseSetup


class DatasetCorrelationMatrixTestCase(BaseSetup):
    def test_get_corr_matrix(self):
        url = reverse("dataset_correlation_matrix", kwargs={
                      "dataset_id": self.dataset.pk})
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        expected_corr_matrix = self.df.corr(numeric_only=True)
        # this step is required so that numeric values are exactly the same
        expected_corr_matrix = expected_corr_matrix.to_json()
        expected_corr_matrix = pd.DataFrame(json.loads(expected_corr_matrix))
        expected_corr_matrix = expected_corr_matrix.round(
            settings.ROUND_DECIMAL_PLACES)
        expected_data = {
            "z": expected_corr_matrix.to_numpy().tolist(),
            "x": list(expected_corr_matrix.index),
            "y": list(expected_corr_matrix.index),
        }
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data, expected_data)
