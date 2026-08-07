import pandas as pd
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetColumn
from rolap.api.models.datasets import DatasetPreviewResponse
from rolap.api.models.datasets import DatasetReadParams
from rolap.api.models.datasets import DatasetRecord
from rolap.api.serializers.datasets import DatasetPreviewResponseSerializer
from rolap.api.serializers.rulesets.rulesets import RulesetFilterJSONSerializer
from rolap.api.utils.parsers import RulesetFilterRequestParser
from rolap.api.views.base import DatasetBaseView


class RulePreviewDatasetView(DatasetBaseView):
    """
    Preview dataset with filters applied from the provided ruleset (with PostgreSQL storage).
    """
    serializer_class = RulesetFilterJSONSerializer
    request_parser = RulesetFilterRequestParser()

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return DatasetPreviewResponseSerializer()

        def get_request_serializer(self, path, method):
            return RulesetFilterJSONSerializer()

        def get_operation(self, path, method):
            op = super().get_operation(path, method)
            op['parameters'].append(
                {"name": "limit", "in": "query", "required": True, 'schema': {'type': 'integer'}})
            op['parameters'].append(
                {"name": "offset", "in": "query", "required": True, 'schema': {'type': 'integer'}})
            op['parameters'].append(
                {"name": "operator", "in": "query", "required": False, 'schema': {'type': 'string'}})
            return op

    schema = _CustomSchema(operation_id_base="dataset_filter_by_rules")

    def post(self, request, *args, **kwargs):
        # get dataset object
        dataset: Dataset = self.get_object()
        project_type = dataset.project.type_of_problem
        # parse request data
        params: DatasetReadParams = self.request_parser.parse_request_params(
            request, problem_type=project_type)
        # read dataset
        df: pd.DataFrame
        count: int
        df, count = dataset.read_dataset_from_storage(params)
        # prepare data for response serialization
        records: list[DatasetRecord] = [
            DatasetRecord(id=index, column_values=record)
            for index, record in df.iterrows()
        ]
        columns: list[DatasetColumn] = dataset.prepare_column_info(params)
        # prepare response and serialize
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
