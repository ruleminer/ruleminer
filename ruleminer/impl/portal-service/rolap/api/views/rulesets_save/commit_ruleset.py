import logging

from django.db import transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.views import APIView
from rolap.api.exceptions import DatasetNotFoundException
from rolap.api.exceptions import RulesetNotSavedException
from rolap.api.models import Dataset
from rolap.api.models import Ruleset
from rolap.api.permissions import IsCeleryWorker
from rolap.api.serializers.rulesets.creation import CommitRulesetSerializer
from rolap.api.serializers.rulesets.rulesets import PredictionConfig
from rolap.api.utils.factories import CrossValidationCreator
from rolap.api.views.rulesets_save.mixins import CommitResultMixin


class CommitRulesetView(CommitResultMixin, APIView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets_save']

        def get_request_serializer(self, path, method):
            return CommitRulesetSerializer()

        def get_response_serializer(self, path, method):
            pass

    schema = _CustomSchema(operation_id_base="commit_ruleset")
    permission_classes = [IsCeleryWorker, ]

    def post(self, request: Request) -> Response:
        """
        API endpoint used by the rule generation worker to save a generated ruleset.
        """
        # collect data from the request
        request_serializer = CommitRulesetSerializer(
            data=request.data)
        request_serializer.is_valid(raise_exception=True)

        # check permissions to the dataset
        dataset_id = request_serializer.validated_data["attached_to_dataset_id"]
        try:
            dataset = get_object_or_404(Dataset, pk=dataset_id)
        except Http404:
            raise DatasetNotFoundException()
        self.check_object_permissions(self.request, dataset)

        # parse request data into the ruleset creator
        data = request_serializer.validated_data
        statistics = data.pop("statistics", {})
        celery_task_id = data.pop("celery_task")
        cross_validation = data.pop("cross_validation")
        num_folds = data.pop("num_folds")
        extra_info = data.pop("extra_info")

        with transaction.atomic():
            try:
                db_ruleset: Ruleset = self.create_ruleset_and_related(
                    data, statistics)
            except Exception as error:
                logging.exception(error, stack_info=True)
                raise RulesetNotSavedException()

        self.process_task(db_ruleset, celery_task_id, extra_info)

        # check if cross-validation was requested and start a task if yes
        if cross_validation:
            prediction_config = PredictionConfig(
                **request_serializer.validated_data["prediction_config"]
            )
            cv_creator: CrossValidationCreator = CrossValidationCreator(
                ruleset=db_ruleset,
                num_folds=num_folds,
                generation_params=db_ruleset.generation_params,
                prediction_config=prediction_config
            )
            cv_creator.initiate_cross_validation()

        return Response(status=status.HTTP_201_CREATED)

    def create_ruleset_and_related(self, data: dict, statistics: dict) -> Ruleset:
        db_ruleset = Ruleset.objects.create(
            **data,
            indicator_calculation_time=statistics["calculation_time"],
            **statistics["characteristics"],
            type=Ruleset.Type.GENERATED,
        )
        # write all data into models in the database
        self.create_rules(db_ruleset, statistics)
        self.process_results(db_ruleset, statistics)

        return db_ruleset
