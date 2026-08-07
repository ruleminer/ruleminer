from typing import Iterable

from celery.result import AsyncResult
from django.conf import settings
from django.db.models import QuerySet
from django.http import Http404
from django.shortcuts import get_object_or_404
from kombu.exceptions import OperationalError
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import AlgorithmNotFoundException
from rolap.api.exceptions import DatasetAttributesNotFoundException
from rolap.api.exceptions import InvalidRequestException
from rolap.api.exceptions import RulesetExistsException
from rolap.api.exceptions import TaskQueueOfflineException
from rolap.api.models import Algorithm
from rolap.api.models import Dataset
from rolap.api.models import DatasetAttributes
from rolap.api.models import Ruleset
from rolap.api.models import Task
from rolap.api.models import TaskType
from rolap.api.models import VotingMeasures
from rolap.api.models.projects import Project
from rolap.api.models.rulesets.rulesets import CreateRulesetRequest
from rolap.api.models.rulesets.worker_rulesets import Attribute
from rolap.api.models.rulesets.worker_rulesets import CreateRulesetWorkerRequest
from rolap.api.serializers.rulesets.creation import RulesetGenerationSerializer
from rolap.api.serializers.rulesets.rulesets import ResponseRuleSetsSerializer
from rolap.api.serializers.rulesets.worker import \
    CreateRuleSetsWorkerSerializer
from rolap.api.utils.factories import AlgorithmParametersFactory
from rolap.api.utils.helper import validate_dataset_attributes_for_problem_type
from rolap.api.views.base import DatasetBaseView
from rolap.celery import app


class RuleSetGenerationView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['ruleset_generation']

        def get_request_serializer(self, path, method):
            return RulesetGenerationSerializer()

        def get_response_serializer(self, path, method):
            return ResponseRuleSetsSerializer()

    schema = _CustomSchema(operation_id_base="ruleset_generation")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.dataset: Dataset = None
        self.algorithm: Algorithm = None
        self.problem_type: str = None

    def post(self, request: Request, *args, **kwargs) -> Response:
        """Creates a new rule set for a specific dataset identified by the dataset_id. Request should include the
        following information regarding rule generation: Selected generation method, Generation parameters,
        Attributes to omit, Name for the rule set The response includes a task_id that can be used to query the
        status of the task and determine if the rule set generation is completed.
        Args:
            request (Request): The HTTP request object.
            dataset_id (int): The ID of the dataset.

        Returns: Response:  The HTTP response object containing identifier for the task associated with the
        rulesets_worker generation.
        """
        request_serializer = RulesetGenerationSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        self.dataset: Dataset = self.get_object()
        self.can_create_ruleset(self.dataset)
        self.problem_type = self.dataset.project.type_of_problem
        ruleset_name: str = request_serializer.validated_data['name']

        self._validate_if_ruleset_already_exists(ruleset_name)
        ruleset_request: CreateRulesetRequest = CreateRulesetRequest(
            **request_serializer.validated_data
        )
        self.algorithm = self._get_algorithm(ruleset_request.algorithm_id)

        params_factory = AlgorithmParametersFactory(
            dataset=self.dataset,
            algorithm=self.algorithm,
        )
        algorithm_params = params_factory.get_algorithm_params(
            request_serializer.validated_data)
        expert_parameters: dict = params_factory.prepare_expert_induction_parameters(
            ruleset_request
        )

        prediction_config = request_serializer.validated_data["prediction_config"]
        VotingMeasures.validate(self.dataset.project,
                                prediction_config.get("voting_measure"))

        selected_attributes: Iterable[Attribute] = self._prepare_and_validate_attributes(
            ruleset_request, algorithm_params
        )
        task_id: int = self._delegate_ruleset_generation_task(
            algorithm_params, expert_parameters, selected_attributes, ruleset_request
        )
        response_serializer = ResponseRuleSetsSerializer({"task_id": task_id})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def _get_algorithm(self, algorithm_id: int) -> Algorithm:
        try:
            return get_object_or_404(Algorithm, pk=algorithm_id)
        except Http404:
            raise AlgorithmNotFoundException()

    def _validate_if_ruleset_already_exists(self, name: str):
        if Ruleset.objects.filter(name=name).filter(attached_to_dataset=self.dataset).exists():
            raise RulesetExistsException()

    def _prepare_and_validate_attributes(
        self,
        ruleset_request: CreateRulesetRequest,
        algorithm_params: dict
    ) -> list[Attribute]:
        # now we need to read dataset attributes from the database and prepare the request
        dataset_attributes_query = DatasetAttributes.objects \
            .filter(dataset=self.dataset) \
            .exclude(name__in=ruleset_request.attributes_to_skip)

        if not dataset_attributes_query.exists():
            raise DatasetAttributesNotFoundException()

        dataset_attributes: Iterable[DatasetAttributes] = dataset_attributes_query \
            .all()
        selected_attributes = [
            Attribute(name=x.name, role=x.role)
            for x in dataset_attributes
        ]
        validate_dataset_attributes_for_problem_type(
            dataset_attributes_query, self.problem_type
        )
        if self.problem_type == Project.SURVIVAL:
            survival_time_attr = self._get_survival_time_attribute_name(
                dataset_attributes_query
            )
            algorithm_params['survival_time_attr'] = survival_time_attr

        return selected_attributes

    def _get_survival_time_attribute_name(self, dataset_attributes_query: QuerySet) -> str:
        label_attribute: DatasetAttributes = next((
            a for a in dataset_attributes_query
            if a.role == DatasetAttributes.DataAttributeRoles.SURVIVAL_TIME),
            None
        )
        return label_attribute.name

    def _delegate_ruleset_generation_task(
        self,
        algorithm_params: dict,
        expert_parameters: dict,
        selected_attributes: Iterable[Attribute],
        ruleset_request: CreateRulesetRequest,
    ) -> int:
        worker_request = CreateRulesetWorkerRequest(
            name=ruleset_request.name,
            description=ruleset_request.description,
            generation_method=ruleset_request.generation_method,
            algorithm_params=algorithm_params,
            expert_induction=expert_parameters,
            attributes=selected_attributes,
            cross_validation=ruleset_request.cross_validation,
            num_folds=ruleset_request.num_folds,
            algorithm_id=ruleset_request.algorithm_id,
            dataset_id=self.dataset.pk,
            dataset_storage_path=self.dataset.path,
            prediction_config=ruleset_request.prediction_config
        )
        serializer = CreateRuleSetsWorkerSerializer(
            worker_request, many=False)
        # initialize task
        db_task = Task.objects.create(
            project=self.dataset.project,
            status=Task.TaskStatus.PENDING,
            meta={
                "generation_params": algorithm_params,
                "type": self.dataset.project.type_of_problem,
            },
            type=TaskType.LEARNING,
        )
        db_task.source_object = self.dataset
        db_task.save()
        task_method = self._get_task_method_for_problem(
            self.algorithm.name, self.problem_type
        )
        try:
            task: AsyncResult = app.send_task(name=task_method, args=(
                serializer.data, db_task.pk), queue=settings.RULE_GENERATION_QUEUE_NAME, task_id=str(db_task.pk))
        except OperationalError:
            db_task.delete()
            raise TaskQueueOfflineException()
        return task.id

    def _get_task_method_for_problem(self, algorithm_name: str, problem_type: str) -> str:
        if problem_type not in [Project.CLASSIFICATION, Project.REGRESSION, Project.SURVIVAL]:
            raise InvalidRequestException(
                "Rule generation for this type of problem is not yet implemented.")
        return f"rule_service.{algorithm_name}.{problem_type}"
