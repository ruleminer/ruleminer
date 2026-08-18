import numpy as np
import pandas as pd
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetColumn
from rolap.api.models.datasets import DatasetPreviewResponse
from rolap.api.models.datasets import DatasetReadParams
from rolap.api.models.datasets import DatasetRecord
from rolap.api.serializers.datasets import DatasetPreviewRequestSerializer
from rolap.api.serializers.datasets import DatasetPreviewResponseSerializer
from rolap.api.utils.parsers import PreviewRequestParser
from rolap.api.views.base import DatasetBaseView


class PreviewDatasetView(DatasetBaseView):
    """
    Preview dataset with filters applied from query parameters (with PostgreSQL storage).
    """
    parser = PreviewRequestParser()

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return DatasetPreviewResponseSerializer()

        def get_request_serializer(self, path, method):
            return DatasetPreviewRequestSerializer()

        def get_operation(self, path, method):
            op = super().get_operation(path, method)
            op['parameters'].append(
                {"name": "limit", "in": "query", "required": True, 'schema': {'type': 'integer'}})
            op['parameters'].append(
                {"name": "offset", "in": "query", "required": True, 'schema': {'type': 'integer'}})
            return op

    schema = _CustomSchema(operation_id_base="dataset_preview")
    serializer_class = DatasetPreviewRequestSerializer

    def post(self, request: Request, dataset_id: int, *args, **kwargs):
        params: DatasetReadParams = self.parser.parse_request_params(
            request)
        dataset: Dataset = self.get_object()

        df: pd.DataFrame
        count: int
        df, count = dataset.read_dataset_from_storage(params)
        # replace all NaN values with None
        df = df.fillna(np.nan).replace([np.nan], [None])

        records: list[DatasetRecord] = [
            DatasetRecord(id=index, column_values=record)
            for index, record in df.iterrows()
        ]
        columns: list[DatasetColumn] = dataset.prepare_column_info(params)
        dataset_response: DatasetPreviewResponse = DatasetPreviewResponse(
            limit=params.limit,
            offset=params.offset,
            count=count,
            columns=columns,
            records=records
        )
        response_serializer = DatasetPreviewResponseSerializer(
            dataset_response,
            many=False
        )
        return Response(response_serializer.data)
