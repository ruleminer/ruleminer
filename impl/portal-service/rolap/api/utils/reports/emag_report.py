from django.conf import settings
from emag_report_models.discovery import DiscoveryReport
from emag_report_models.prediction import PredictionReport
from kombu.exceptions import OperationalError
from rolap.api.exceptions import TaskQueueOfflineException
from rolap.api.models import Dataset
from rolap.api.models import Task
from rolap.api.models import TaskType
from rolap.celery import app


def generate_emag_report_for_dataset(dataset: Dataset, request: DiscoveryReport or PredictionReport):
    """
    Helper function to generate EMAG reports for a dataset.
    """
    task_name = "reports.discovery_report" if isinstance(
        request, DiscoveryReport) else "reports.prediction_report"
    task_type = "knowledge discovery report" if isinstance(
        request, DiscoveryReport) else "prediction report"
    # initialize task
    db_task = Task.objects.create(
        project=dataset.project,
        status=Task.TaskStatus.PENDING,
        meta={
            "title": request.title,
            "generation_params": request.to_metadata(),
            "type": task_type,
        },
        type=TaskType.REPORT,
    )
    db_task.source_object = dataset
    db_task.save()
    # send task
    try:
        app.send_task(
            name=task_name,
            args=(request.dict(), db_task.pk, dataset.pk, str(dataset.path)),
            queue=settings.REPORT_GENERATION_QUEUE_NAME,
            task_id=str(db_task.pk)
        )
    except OperationalError:
        db_task.delete()
        raise TaskQueueOfflineException()

    return db_task
