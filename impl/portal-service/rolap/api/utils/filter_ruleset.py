from dataclasses import asdict

from django.conf import settings
from kombu.exceptions import OperationalError
from rolap.api.exceptions import TaskQueueOfflineException
from rolap.api.models import Project
from rolap.api.models import Ruleset
from rolap.api.models import Task
from rolap.api.models import TaskType
from rolap.api.models.rulesets.worker_rulesets import FilterRulesetWorkerRequest
from rolap.celery import app


def filter_ruleset(
        request: FilterRulesetWorkerRequest,
        project: Project,
        source_ruleset: Ruleset
) -> Task:
    # initialize db task
    db_task = Task.objects.create(
        project=project,
        status=Task.TaskStatus.PENDING,
        meta={
            "generation_params": source_ruleset.generation_params["algorithm_params"],
            "filter_algorithm": request.filter_algorithm,
            "type": request.problem_type,
        },
        type=TaskType.FILTER_RULESET,
    )
    db_task.source_object = source_ruleset.attached_to_dataset
    db_task.save()

    # prepare data
    request = asdict(request)

    # send task
    try:
        app.send_task(
            name="rule_service.filter_ruleset", args=(request, db_task.pk),
            queue=settings.RULE_GENERATION_QUEUE_NAME, task_id=str(db_task.pk)
        )
    except OperationalError:
        db_task.delete()
        raise TaskQueueOfflineException()

    return db_task
