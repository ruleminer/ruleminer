from rest_framework import status
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Ruleset
from rolap.api.models.rulesets.worker_rulesets import SaveRulesetWorkerRequest
from rolap.api.serializers.rulesets.creation import OverwriteRulesetSerializer
from rolap.api.serializers.rulesets.creation import RulesetKwargsSerializer
from rolap.api.serializers.tasks import TaskResponseSerializer
from rolap.api.utils.statistics import calculate_ruleset_indicators
from rolap.api.views.base import RulesetBaseView
from rolap.api.views.rulesets_save.mixins import CreateRulesetMixin


class OverwriteRulesetView(CreateRulesetMixin, RulesetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets_save']

        def get_request_serializer(self, path, method):
            return OverwriteRulesetSerializer()

        def get_response_serializer(self, path, method):
            return TaskResponseSerializer()

    schema = _CustomSchema(operation_id_base="overwrite_ruleset")
    serializer_class = OverwriteRulesetSerializer

    def patch(self, request, *args, **kwargs):
        # parse data
        serializer = OverwriteRulesetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.validate_rules_labels(serializer.validated_data['rules_labels'])
        new_ruleset_json = serializer.validated_data["ruleset"]

        # get the original ruleset object
        db_ruleset: Ruleset = self.get_object()

        # get kwargs of the overwritten ruleset
        ruleset_kwargs = RulesetKwargsSerializer(db_ruleset).data
        ruleset_kwargs = dict(ruleset_kwargs)
        ruleset_kwargs.pop("attached_to_dataset")
        ruleset_kwargs.pop("generated_from_dataset")
        ruleset_kwargs.pop("prediction_config")
        ruleset_kwargs["type"] = Ruleset.Type.MODIFIED

        prediction_config = db_ruleset.get_updated_config(
            serializer.validated_data.get("prediction_config", {}))

        # create worker request
        dataset = db_ruleset.attached_to_dataset
        worker_request = SaveRulesetWorkerRequest(
            ruleset_kwargs=ruleset_kwargs,
            ruleset=new_ruleset_json,
            problem_type=dataset.project.type_of_problem,
            dataset_storage_path=str(dataset.path),
            algorithm_params=db_ruleset.generation_params["algorithm_params"],
            attributes=self.get_attributes(dataset, db_ruleset.ruleset),
            rules_labels=serializer.validated_data['rules_labels'],
            overwrite_ruleset_id=db_ruleset.pk,
            prediction_config=prediction_config
        )

        db_task = calculate_ruleset_indicators(
            worker_request, dataset.project, dataset
        )

        # return response
        response_serializer = TaskResponseSerializer(db_task)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
