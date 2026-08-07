import json

import numpy as np
import pandas as pd
from django.conf import settings
from django.http import HttpRequest
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Dataset
from rolap.api.serializers.datasets import DatasetCorrelationMatrixSerializer
from rolap.api.views.base import DatasetBaseView


class DatasetCorrelationMatrixView(DatasetBaseView):
    """
    View to get correlation matrix for a dataset (pearsons correlation).
    Args: dataset_id
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_path_parameters(self, path, method):
            parameters: list = super().get_path_parameters(path, method)
            parameters.append({
                "name": 'min_corr',
                "in": "path",
                "required": True,
                "description": (
                    'Return matrix for elements with the absolute value of the ' +
                    'correlation is greater or equal to given value.'
                ),
                'schema': {
                    'type': 'float',
                },
            })
            return parameters

        def get_response_serializer(self, path, method):
            return DatasetCorrelationMatrixSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="dataset_correlation_matrix")
    pagination_class = None

    def get(self, request: HttpRequest, *args, **kwargs):
        dataset = self.get_object()
        if dataset.correlation_matrix is None:
            # a temporary measure for older entries:
            # if there is no corr matrix in DB, calculate it and save it
            self._calculate_correlation_matrix(dataset)
        corr_matrix = pd.DataFrame(json.loads(dataset.correlation_matrix))
        corr_matrix = corr_matrix.round(settings.ROUND_DECIMAL_PLACES)
        matrix_data = {
            "z": corr_matrix.to_numpy().tolist(),
            "x": list(corr_matrix.index),
            "y": list(corr_matrix.index),
        }
        sanitized_matrix_data = self._sanitize_matrix_data(matrix_data)
        serializer = DatasetCorrelationMatrixSerializer(sanitized_matrix_data)
        return Response(serializer.data)

    def _calculate_correlation_matrix(self, dataset: Dataset):
        df: pd.DataFrame
        df, _ = dataset.read_dataset_from_storage()
        corr_matrix = df.corr(
            numeric_only=True).round(settings.ROUND_DECIMAL_PLACES)
        dataset.correlation_matrix = corr_matrix.to_json()
        dataset.save()

    def _sanitize_matrix_data(self, matrix_data: dict) -> dict:
        sanitized_z = []

        for row in matrix_data["z"]:
            sanitized_row = []
            for x in row:
                if np.isinf(x) and x > 0:
                    sanitized_row.append("inf")
                elif np.isinf(x) and x < 0:
                    sanitized_row.append("-inf")
                elif np.isnan(x):
                    sanitized_row.append(None)
                else:
                    sanitized_row.append(x)
            sanitized_z.append(sanitized_row)

        matrix_data["z"] = sanitized_z
        return matrix_data
