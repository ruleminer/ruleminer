import logging

from django.db import transaction
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import RulesetNotSavedException
from rolap.api.models import Ruleset
from rolap.api.permissions import IsCeleryWorker
from rolap.api.serializers.rulesets.creation import CommitStatisticsSerializer
from rolap.api.serializers.rulesets.creation import RulesetKwargsSerializer
from rolap.api.views.rulesets_save.mixins import CommitResultMixin


class CommitRulesetIndicatorsView(CommitResultMixin, CreateAPIView):
    serializer_class = CommitStatisticsSerializer
    permission_classes = [IsCeleryWorker, ]

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets_save']

        def get_request_serializer(self, path, method):
            return CommitStatisticsSerializer()

        def get_response_serializer(self, path, method):
            pass

    schema = _CustomSchema(
        operation_id_base="ruleset_indicators_upload_result")

    def create(self, request: Request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # extract task id and get task
        task_id = data.pop("celery_task")
        extra_info = data.pop("extra_info")

        # get ruleset - existing or new
        with transaction.atomic():
            try:
                if data["overwrite_ruleset_id"] is not None:
                    ruleset = self.get_existing_ruleset(data)
                else:
                    ruleset = self.create_new_ruleset(data)
                self.update_ruleset(ruleset, data)
                self.save_statistics(ruleset, data)
                self.save_rules_labels(ruleset, data["rules_labels"])
            except Exception as error:
                logging.exception(error, stack_info=True)
                raise RulesetNotSavedException()

        self.process_task(ruleset, task_id, extra_info)

        return Response(status=status.HTTP_201_CREATED)

    def get_existing_ruleset(self, data: dict) -> Ruleset:
        ruleset = Ruleset.objects.get(pk=data["overwrite_ruleset_id"])
        serializer = RulesetKwargsSerializer(instance=ruleset)
        serializer_data: dict = data["ruleset_kwargs"]
        serializer_data['prediction_config'] = data["prediction_config"]
        serializer.update(ruleset, serializer_data)
        return ruleset

    def create_new_ruleset(self, data: dict) -> Ruleset:
        serializer_data: dict = data["ruleset_kwargs"]
        serializer_data["prediction_config"] = data["prediction_config"]
        serializer = RulesetKwargsSerializer(data=serializer_data)
        serializer.is_valid()
        ruleset = serializer.save()
        return ruleset

    def update_ruleset(self, ruleset: Ruleset, data: dict):
        ruleset.ruleset = data["ruleset"]
        ruleset.generation_params = data["generation_params"]
        ruleset.prediction_config = data["prediction_config"]
        ruleset.comments = data.get("comments")
        ruleset.save()

    def save_statistics(self, ruleset: Ruleset, data: dict):
        statistics = data["statistics"]
        ruleset.indicator_calculation_time = statistics["calculation_time"]
        for key, value in statistics["characteristics"].items():
            setattr(ruleset, key, value)
        ruleset.save()
        self.create_rules(ruleset, statistics)
        self.process_results(ruleset, statistics)
