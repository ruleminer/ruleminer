import pandas as pd
from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetReadParams
from rolap.api.serializers.datasets import CreateDatasetResponseSerializer
from rolap.api.serializers.rulesets.rulesets import RulesetModifyJSONSerializer
from rolap.api.utils.factories import DerivedDatasetCreator
from rolap.api.utils.parsers import RulesetModifyRequestParser
from rolap.api.views.base import DatasetBaseView


class RuleModifyDatasetView(DatasetBaseView):
    """
    Load dataset with filters applied based on the provided ruleset and save it as a new dataset
    (with PostgreSQL storage).
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return CreateDatasetResponseSerializer()

        def get_request_serializer(self, path, method):
            return RulesetModifyJSONSerializer()

    schema = _CustomSchema(operation_id_base="dataset_modify_by_rules")
    serializer_class = RulesetModifyJSONSerializer
    request_parser = RulesetModifyRequestParser()

    def post(self, request, *args, **kwargs):
        # get dataset object
        old_dataset: Dataset = self.get_object()
        self.can_create_dataset(old_dataset.project)
        project_type = old_dataset.project.type_of_problem
        # parse request data
        params: DatasetReadParams = self.request_parser.parse_request_params(
            request, problem_type=project_type)
        # read dataset
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
