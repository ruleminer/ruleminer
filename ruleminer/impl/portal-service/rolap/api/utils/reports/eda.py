from django.conf import settings
from kombu.exceptions import OperationalError
from rolap.api.exceptions import TaskQueueOfflineException
from rolap.api.models import Dataset
from rolap.api.models import Task
from rolap.api.models import TaskType
from rolap.celery import app


def generate_eda_report_for_dataset(dataset: Dataset, title: str):
    """
    Helper function to generate EDA report for a dataset.
    """
    # initialize task
    db_task = Task.objects.create(
        project=dataset.project,
        status=Task.TaskStatus.PENDING,
        meta={
            "title": title,
            "generation_params": {},
            "type": "EDA report",
        },
        type=TaskType.REPORT,
    )
    db_task.source_object = dataset
    db_task.save()
    # prepare task request
    request = {
        "dataset_name": dataset.name,
        "title": title,
    }
    # send task
    try:
        app.send_task(
            name="reports.eda_report",
            args=(request, db_task.pk, dataset.pk, str(dataset.path)),
            queue=settings.REPORT_GENERATION_QUEUE_NAME,
            task_id=str(db_task.pk)
        )
    except OperationalError:
        db_task.delete()
        raise TaskQueueOfflineException()

    return db_task
