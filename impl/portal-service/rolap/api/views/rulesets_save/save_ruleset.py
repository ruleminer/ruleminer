from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import DatasetNotFoundException
from rolap.api.models import Dataset
from rolap.api.models import Ruleset
from rolap.api.models import VotingMeasures
from rolap.api.models.rulesets.worker_rulesets import SaveRulesetWorkerRequest
from rolap.api.serializers.rulesets.creation import RulesetKwargsSerializer
from rolap.api.serializers.rulesets.creation import SaveRulesetSerializer
from rolap.api.serializers.tasks import TaskResponseSerializer
from rolap.api.utils.statistics import calculate_ruleset_indicators
from rolap.api.views.base import RulesetBaseView
from rolap.api.views.rulesets_save.mixins import CreateRulesetMixin


class SaveRulesetView(CreateRulesetMixin, RulesetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets_save']

        def get_request_serializer(self, path, method):
            return SaveRulesetSerializer()

        def get_response_serializer(self, path, method):
            return TaskResponseSerializer()

    schema = _CustomSchema(operation_id_base="save_ruleset")
    serializer_class = SaveRulesetSerializer

    def post(self, request: Request, *args, **kwargs):
        # parse request data
        serializer = SaveRulesetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # get original ruleset
        original_ruleset: Ruleset = self.get_object()

        # get dataset and check if it is a correct choice
        try:
            dataset = get_object_or_404(
                Dataset, pk=serializer.validated_data["attached_to_dataset_id"])
        except Http404:
            raise DatasetNotFoundException()
        self.check_object_permissions(request, dataset)
        self.check_dataset_compliance(dataset)
        self.can_create_ruleset(dataset)
        self.check_attribute_match(data["ruleset"], dataset)
        self.validate_name(dataset, data["name"])
        self.validate_rules_labels(data["rules_labels"])
        VotingMeasures.validate(
            dataset.project, data["prediction_config"]["voting_measure"]
        )

        # get and update kwargs for the saved ruleset
        ruleset_kwargs = RulesetKwargsSerializer(original_ruleset).data
        ruleset_kwargs = dict(ruleset_kwargs)
        ruleset_kwargs["name"] = data["name"]
        ruleset_kwargs["description"] = data.get("description")
        ruleset_kwargs["type"] = Ruleset.Type.MODIFIED
        ruleset_kwargs["attached_to_dataset"] = dataset.pk

        # create worker request
        worker_request = SaveRulesetWorkerRequest(
            ruleset_kwargs=ruleset_kwargs,
            ruleset=data["ruleset"],
            problem_type=dataset.project.type_of_problem,
            dataset_storage_path=str(dataset.path),
            algorithm_params=original_ruleset.generation_params["algorithm_params"],
            attributes=self.get_attributes(dataset, original_ruleset.ruleset),
            rules_labels=data['rules_labels'],
            prediction_config=data["prediction_config"],
        )

        db_task = calculate_ruleset_indicators(
            worker_request, dataset.project, dataset
        )

        # return response
        response_serializer = TaskResponseSerializer(db_task)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
