from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import DatasetNotFoundException
from rolap.api.models import Dataset
from rolap.api.models import Ruleset
from rolap.api.models.rulesets.worker_rulesets import SaveRulesetWorkerRequest
from rolap.api.serializers.rulesets.creation import CopyRulesetSerializer
from rolap.api.serializers.rulesets.creation import RulesetKwargsSerializer
from rolap.api.serializers.tasks import TaskResponseSerializer
from rolap.api.utils.statistics import calculate_ruleset_indicators
from rolap.api.views.base import RulesetBaseView
from rolap.api.views.rulesets_save.mixins import CreateRulesetMixin


class CopyRulesetView(CreateRulesetMixin, RulesetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets_save']

        def get_request_serializer(self, path, method):
            return CopyRulesetSerializer()

        def get_response_serializer(self, path, method):
            return TaskResponseSerializer()

    schema = _CustomSchema(operation_id_base="copy_ruleset")
    serializer_class = CopyRulesetSerializer

    def post(self, request: Request, *args, **kwargs):
        # get serializer data
        serializer = CopyRulesetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # get the original ruleset
        original_ruleset: Ruleset = self.get_object()

        # get the new dataset
        dataset_id = self.kwargs["dataset_id"]
        try:
            target_dataset: Dataset = get_object_or_404(Dataset, pk=dataset_id)
        except Http404:
            raise DatasetNotFoundException()
        self.check_object_permissions(self.request, target_dataset)
        self.check_dataset_compliance(target_dataset)
        self.can_create_ruleset(target_dataset)

        # check if dataset and ruleset are compatible
        self.check_attribute_match(original_ruleset.ruleset, target_dataset)
        self.validate_name(target_dataset, data["name"])

        # get and update kwargs for the copied ruleset
        ruleset_kwargs = RulesetKwargsSerializer(original_ruleset).data
        ruleset_kwargs = dict(ruleset_kwargs)
        ruleset_kwargs["name"] = data["name"]
        ruleset_kwargs["description"] = data.get(
            "description") or original_ruleset.description
        ruleset_kwargs["attached_to_dataset"] = target_dataset.pk
        prediction_config = ruleset_kwargs["prediction_config"]

        # create worker request
        worker_request = SaveRulesetWorkerRequest(
            ruleset_kwargs=ruleset_kwargs,
            ruleset=original_ruleset.ruleset,
            problem_type=target_dataset.project.type_of_problem,
            dataset_storage_path=str(target_dataset.path),
            algorithm_params=original_ruleset.generation_params["algorithm_params"],
            attributes=self.get_attributes(
                target_dataset, original_ruleset.ruleset),
            rules_labels=self._get_ruleset_labels(original_ruleset),
            prediction_config=prediction_config
        )

        db_task = calculate_ruleset_indicators(
            worker_request, target_dataset.project, target_dataset
        )

        # return response
        response_serializer = TaskResponseSerializer(db_task)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def _get_ruleset_labels(self, ruleset: Ruleset) -> dict[str, list[int]]:
        return {
            str(rule.uuid): [
                label.id for label in rule.assigned_labels.all()
            ]
            for rule in ruleset.rules.all()
        }
