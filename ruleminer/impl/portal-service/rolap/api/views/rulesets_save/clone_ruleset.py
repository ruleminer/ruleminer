import logging
from copy import deepcopy

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import RulesetNotSavedException
from rolap.api.models import ImportanceResults
from rolap.api.models import PredictionResults
from rolap.api.models import Ruleset
from rolap.api.serializers.rulesets.creation import CloneRulesetSerializer
from rolap.api.serializers.rulesets.creation import CreateRulesetResponseSerializer
from rolap.api.views.base import RulesetBaseView
from rolap.api.views.rulesets_save.mixins import CreateRulesetMixin


class CloneRulesetView(CreateRulesetMixin, RulesetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets_save']

        def get_request_serializer(self, path, method):
            return CloneRulesetSerializer()

        def get_response_serializer(self, path, method):
            return CreateRulesetResponseSerializer()

    schema = _CustomSchema(operation_id_base="clone_ruleset")
    serializer_class = CloneRulesetSerializer

    def post(self, request, *args, **kwargs):
        # parse data
        serializer = CloneRulesetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # get old objects
        original_ruleset: Ruleset = self.get_object()
        dataset = original_ruleset.attached_to_dataset
        self.can_create_ruleset(dataset)
        self.validate_name(dataset, data["name"])

        try:
            with transaction.atomic():
                # get old results
                importance_result = ImportanceResults.objects.get(
                    ruleset=original_ruleset)
                prediction_result = PredictionResults.objects.get(
                    ruleset=original_ruleset)
                # clone ruleset
                copied_ruleset = deepcopy(original_ruleset)
                copied_ruleset.pk = None
                copied_ruleset.name = data["name"]
                copied_ruleset.description = data.get(
                    "description") or original_ruleset.description
                copied_ruleset.save()
                # clone rules
                for rule in original_ruleset.rules.all():
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
                prediction_result.dataset = copied_ruleset.attached_to_dataset
                prediction_result.save()
        except Exception as error:
            logging.exception(error, stack_info=True)
            raise RulesetNotSavedException()

        # return response
        response_serializer = CreateRulesetResponseSerializer(copied_ruleset)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
