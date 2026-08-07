from dataclasses import dataclass

from django.conf import settings
from rolap.api.models import Ruleset
from rolap.api.models import Task
from rolap.api.models import TaskType
from rolap.api.models.rulesets.worker_crossvalidation import \
    CreateCrossValidationWorkerRequest
from rolap.api.serializers.rulesets.rulesets import PredictionConfig
from rolap.api.serializers.rulesets.worker import \
    CreateCrossValidationWorkerRequestSerializer
from rolap.celery import app


@dataclass
class CrossValidationCreator:
    """
    Helper class which processes information about cross-validation
    and sends a CV task to the queue.
    """
    ruleset: Ruleset
    num_folds: int
    generation_params: dict
    prediction_config: PredictionConfig

    def get_cv_task_method_for_problem(self):
        problem_type = self.ruleset.attached_to_dataset.project.type_of_problem
        return f"rule_service.{self.ruleset.algorithm.name}.{problem_type}_cross_validation"

    def initiate_cross_validation(self):
        dataset = self.ruleset.attached_to_dataset
        worker_request: CreateCrossValidationWorkerRequest = CreateCrossValidationWorkerRequest(
            ruleset_id=self.ruleset.pk,
            dataset_id=dataset.pk,
            dataset_storage_path=dataset.path,
            algorithm_params=self.generation_params["algorithm_params"],
            algorithm_id=self.ruleset.algorithm.pk,
            attributes=self.generation_params["attributes"],
            num_folds=self.num_folds,
            prediction_config=self.prediction_config
        )
        serializer: CreateCrossValidationWorkerRequestSerializer = CreateCrossValidationWorkerRequestSerializer(
            worker_request, many=False)

        # initialize task
        db_task = Task.objects.create(
            project=self.ruleset.attached_to_dataset.project,
            status=Task.TaskStatus.PENDING,
            meta={
                "generation_params": self.generation_params["algorithm_params"],
                "type": dataset.project.type_of_problem,
            },
            type=TaskType.CROSS_VALIDATION,
        )
        db_task.source_object = self.ruleset.generated_from_dataset
        db_task.save()
        task_method = self.get_cv_task_method_for_problem()
        app.send_task(
            name=task_method, args=(serializer.data, db_task.pk),
            queue=settings.RULE_GENERATION_QUEUE_NAME, task_id=str(db_task.pk)
        )
