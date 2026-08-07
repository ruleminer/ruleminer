from celery import current_task
from celery.contrib.abortable import AbortableTask
from emag_reports.models import ProblemType
from emag_reports.models.prediction import ClassificationPredictionReport
from emag_reports.models.prediction import PredictionReport
from emag_reports.models.prediction import RegressionPredictionReport
from emag_reports.models.prediction import SurvivalPredictionReport
from tasks.base import generate_report_from_emag
from utils.storage import read_from_storage
from worker import app

PREDICTION_REPORT_MAPPING = {
    ProblemType.CLASSIFICATION: ClassificationPredictionReport,
    ProblemType.REGRESSION: RegressionPredictionReport,
    ProblemType.SURVIVAL: SurvivalPredictionReport,
}


@app.task(name="reports.prediction_report", queue="report_queue", base=AbortableTask)
def generate_prediction_report(request_object: dict, task_id: int, dataset_id: int, dataset_path: str):
    # check if task has been aborted
    if current_task.is_aborted():
        return

    current_task.backend.mark_as_started(task_id)

    # parse request object
    request = PredictionReport(**request_object)
    request_class = PREDICTION_REPORT_MAPPING[request.problem_type]
    request = request_class(**request_object)
    dataset = read_from_storage(dataset_path)
    request.dataset.dataset = dataset.to_json(index=True)

    # check if task has been aborted
    if current_task.is_aborted():
        return

    return generate_report_from_emag(request, task_id, dataset_id)
