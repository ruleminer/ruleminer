from dataclasses import asdict

from django.conf import settings
from kombu.exceptions import OperationalError
from rolap.api.exceptions import TaskQueueOfflineException
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.models import Task
from rolap.api.models import TaskType
from rolap.api.models.rulesets.worker_rulesets import SaveRulesetWorkerRequest
from rolap.celery import app


def calculate_ruleset_indicators(
        request: SaveRulesetWorkerRequest,
        project: Project,
        source_object: Dataset
) -> Task:
    # initialize db task
    db_task = Task.objects.create(
        project=project,
        status=Task.TaskStatus.PENDING,
        meta={
            "generation_params": request.algorithm_params,
            "type": request.problem_type,
        },
        type=TaskType.SAVE_RULESET,
    )
    db_task.source_object = source_object
    db_task.save()

    # prepare data
    request = asdict(request)

    # send task
    try:
        app.send_task(
            name="rule_service.calculate_indicators", args=(request, db_task.pk),
            queue=settings.RULE_GENERATION_QUEUE_NAME, task_id=str(db_task.pk)
        )
    except OperationalError as e:
        db_task.delete()
        raise TaskQueueOfflineException() from e

    return db_task
