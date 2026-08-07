from copy import deepcopy

import pandas as pd
from django.db import transaction
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Dataset
from rolap.api.models import ImportanceResults
from rolap.api.models import PredictionResults
from rolap.api.serializers.datasets import CloneDatasetRequestSerializer
from rolap.api.serializers.datasets import CreateDatasetResponseSerializer
from rolap.api.utils.factories import DerivedDatasetCreator
from rolap.api.views.base import DatasetBaseView


class CloneDatasetView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return CreateDatasetResponseSerializer()

        def get_request_serializer(self, path, method):
            return CloneDatasetRequestSerializer()

    schema = _CustomSchema(operation_id_base="dataset_clone")

    def post(self, request: Request, *args, **kwargs):
        old_dataset: Dataset = self.get_object()
        self.can_create_dataset(old_dataset.project)

        df: pd.DataFrame
        df, _ = old_dataset.read_dataset_from_storage()
        serializer = CloneDatasetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        clone_related = data.pop("clone_related")

        with transaction.atomic():
            creator = DerivedDatasetCreator(self.limits)
            new_dataset: Dataset = creator.create_new_dataset(
                old_dataset, df,
                name=data["name"],
                description=data["description"] or old_dataset.description,
                correlation_matrix=old_dataset.correlation_matrix
            )
            if clone_related:
                self._clone_related(old_dataset, new_dataset)

        response_serializer = CreateDatasetResponseSerializer(new_dataset)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def _clone_related(self, old_dataset: Dataset, new_dataset: Dataset):
        rulesets = old_dataset.attached_rulesets.prefetch_related().all()
        for ruleset in rulesets:
            # get old results
            importance_result = ImportanceResults.objects.get(
                ruleset=ruleset)
            prediction_result = PredictionResults.objects.get(
                ruleset=ruleset)
            # clone ruleset
            copied_ruleset = deepcopy(ruleset)
            copied_ruleset.pk = None
            copied_ruleset.attached_to_dataset = new_dataset
            copied_ruleset.save()
            # clone rules
            for rule in ruleset.rules.all():
                original_rule_labels = list(rule.assigned_labels.all())
                rule.pk = None
                rule.ruleset = copied_ruleset
                rule.save()
                rule.assigned_labels.set(original_rule_labels)
            # clone importance results
            importance_result.pk = None
            importance_result.ruleset = copied_ruleset
            importance_result.save()
            # clone prediction results
            prediction_result.pk = None
            prediction_result.ruleset = copied_ruleset
            prediction_result.dataset = new_dataset
            prediction_result.save()
