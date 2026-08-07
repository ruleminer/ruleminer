import pandas as pd
from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetReadParams
from rolap.api.serializers.datasets import CreateDatasetResponseSerializer
from rolap.api.serializers.datasets import ModifyDatasetRequestSerializer
from rolap.api.utils.factories import DerivedDatasetCreator
from rolap.api.utils.parsers import ModifyRequestParser
from rolap.api.views.base import DatasetBaseView


class ModifyDatasetView(DatasetBaseView):
    """
    Load dataset with filters applied from query parameters and save it as a new dataset
    (with PostgreSQL storage).
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return CreateDatasetResponseSerializer()

        def get_request_serializer(self, path, method):
            return ModifyDatasetRequestSerializer()

    schema = _CustomSchema(operation_id_base="dataset_modify")
    serializer_class = ModifyDatasetRequestSerializer
    parser = ModifyRequestParser()

    def post(self, request: Request, *args, **kwargs):
        params: DatasetReadParams = self.parser.parse_request_params(
            request)
        old_dataset: Dataset = self.get_object()
        self.can_create_dataset(old_dataset.project)
        df: pd.DataFrame
        df, _ = old_dataset.read_dataset_from_storage(params)

        with transaction.atomic():
            creator = DerivedDatasetCreator(self.limits)
            corr_matrix = df.corr(
                numeric_only=True).round(settings.ROUND_DECIMAL_PLACES)
            new_dataset: Dataset = creator.create_new_dataset(
                old_dataset, df,
                name=params.name,
                description=old_dataset.description,
                correlation_matrix=corr_matrix.to_json(),
            )

        response_serializer = CreateDatasetResponseSerializer(new_dataset)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
