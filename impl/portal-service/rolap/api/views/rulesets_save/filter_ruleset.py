from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Ruleset
from rolap.api.models import VotingMeasures
from rolap.api.models.rulesets.worker_rulesets import \
    FilterRulesetWorkerRequest
from rolap.api.serializers.rulesets.creation import FilterRulesetSerializer
from rolap.api.serializers.rulesets.creation import RulesetKwargsSerializer
from rolap.api.serializers.tasks import TaskResponseSerializer
from rolap.api.utils.filter_ruleset import filter_ruleset
from rolap.api.views.base import RulesetBaseView
from rolap.api.views.rulesets_save.mixins import CreateRulesetMixin


class FilterRulesetView(CreateRulesetMixin, RulesetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets_save']

        def get_request_serializer(self, path, method):
            return FilterRulesetSerializer()

        def get_response_serializer(self, path, method):
            return TaskResponseSerializer()

    schema = _CustomSchema(operation_id_base="filter_ruleset")
    serializer_class = FilterRulesetSerializer

    def post(self, request: Request, *args, **kwargs):
        # get serializer data
        serializer = FilterRulesetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # get the original ruleset
        original_ruleset: Ruleset = self.get_object()
        dataset = original_ruleset.attached_to_dataset
        self.can_create_ruleset(dataset)
        project = dataset.project

        self.validate_name(dataset, data["name"])
        VotingMeasures.validate(
            project, data["prediction_config"]["voting_measure"]
        )

        # get and update kwargs for the copied ruleset
        ruleset_kwargs = RulesetKwargsSerializer(original_ruleset).data
        ruleset_kwargs = dict(ruleset_kwargs)
        ruleset_kwargs["name"] = data["name"]
        ruleset_kwargs["type"] = Ruleset.Type.FILTERED
        ruleset_kwargs["description"] = data.get(
            "description") or original_ruleset.description
        ruleset_kwargs["attached_to_dataset"] = dataset.pk

        # create worker request
        worker_request = FilterRulesetWorkerRequest(
            ruleset_kwargs=ruleset_kwargs,
            ruleset=original_ruleset.ruleset,
            filter_algorithm=data["filter_algorithm"],
            loss=data["loss"],
            problem_type=project.type_of_problem,
            dataset_storage_path=str(dataset.path),
            generation_params=original_ruleset.generation_params,
            rules_labels=self._get_ruleset_labels(original_ruleset),
            prediction_config=data["prediction_config"],
        )

        db_task = filter_ruleset(
            worker_request, project, original_ruleset
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
