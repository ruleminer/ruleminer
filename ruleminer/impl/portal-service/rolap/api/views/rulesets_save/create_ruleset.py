from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import DatasetNotFoundException
from rolap.api.models import Dataset
from rolap.api.models import Ruleset
from rolap.api.models import VotingMeasures
from rolap.api.models.rulesets.worker_rulesets import SaveRulesetWorkerRequest
from rolap.api.permissions import IsRolapUser
from rolap.api.permissions import OwnerPermission
from rolap.api.serializers.rulesets.creation import UserCreateRulesetSerializer
from rolap.api.serializers.rulesets.rulesets import PredictionConfig
from rolap.api.serializers.tasks import TaskResponseSerializer
from rolap.api.utils.statistics import calculate_ruleset_indicators
from rolap.api.views.base import UserLimitsMixin
from rolap.api.views.rulesets_save.mixins import CreateRulesetMixin


class CreateRulesetView(CreateRulesetMixin, UserLimitsMixin, GenericAPIView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets_save']

        def get_request_serializer(self, path, method):
            return UserCreateRulesetSerializer()

        def get_response_serializer(self, path, method):
            return TaskResponseSerializer()

    schema = _CustomSchema(operation_id_base="create_ruleset")
    serializer_class = UserCreateRulesetSerializer
    permission_classes = [IsRolapUser & OwnerPermission]

    def post(self, request: Request, *args, **kwargs):
        # parse request data
        serializer = UserCreateRulesetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # get dataset
        try:
            dataset = get_object_or_404(
                Dataset, pk=data["attached_to_dataset_id"])
        except Http404:
            raise DatasetNotFoundException()
        self.check_object_permissions(request, dataset)
        self.check_dataset_compliance(dataset)
        self.can_create_ruleset(dataset)

        # check if dataset and ruleset are compatible
        self.check_attribute_match(data["ruleset"], dataset)
        self.validate_name(dataset, data["name"])
        self.validate_rules_labels(data.get("rules_labels"))

        # set kwargs for the new ruleset
        ruleset_kwargs = {
            "name": data["name"],
            "description": data.get("description"),
            "attached_to_dataset": dataset.pk,
            "type": Ruleset.Type.MANUAL,
        }

        generation_params = data["generation_params"]
        algorithm_params = generation_params.get(
            "algorithm_params") or self.get_default_algorithm_params()

        prediction_config = data["prediction_config"]
        VotingMeasures.validate(
            dataset.project, prediction_config["voting_measure"])

        # create worker request
        worker_request = SaveRulesetWorkerRequest(
            ruleset_kwargs=ruleset_kwargs,
            ruleset=data["ruleset"],
            problem_type=dataset.project.type_of_problem,
            dataset_storage_path=str(dataset.path),
            algorithm_params=algorithm_params,
            attributes=self.get_attributes(dataset, data["ruleset"]),
            rules_labels=data["rules_labels"],
            prediction_config=PredictionConfig(**prediction_config)
        )

        db_task = calculate_ruleset_indicators(
            worker_request, dataset.project, dataset
        )

        # return response
        response_serializer = TaskResponseSerializer(db_task)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
