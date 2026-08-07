import io

import pandas as pd
from celery import current_task
from celery.contrib.abortable import AbortableTask
from exceptions import ReportGenerationError
from models import EDAReportRequest
from results import ReportGenerationResult
from utils.files import create_file_path
from utils.reports_sftp import put_report_file
from utils.storage import read_from_storage
from worker import app
from ydata_profiling import ProfileReport


@app.task(name="reports.eda_report", queue="report_queue", base=AbortableTask)
def generate_eda_report(request_object: dict, task_id: int, dataset_id: int, dataset_path: str):
    # check if task has been aborted
    if current_task.is_aborted():
        return

    current_task.backend.mark_as_started(task_id)

    # parse request object
    request = EDAReportRequest.from_params(request_object)

    # load dataframe from storage
    df: pd.DataFrame = read_from_storage(dataset_path)

    # check if task has been aborted
    if current_task.is_aborted():
        return

    # generate report
    try:
        html_report = ProfileReport(df, title=request.TITLE).to_html()
    except Exception as e:
        raise ReportGenerationError(e)

    # check if task has been aborted
    if current_task.is_aborted():
        return

    # get report paths
    db_path = create_file_path(
        "eda", dataset_id)

    # save report
    html_report = io.BytesIO(html_report.encode())
    put_report_file(html_report, db_path)

    # return result
    result = ReportGenerationResult(
        dataset_id=dataset_id,
        storage_path=db_path,
        type="EDA",
        title=request.TITLE,
        generation_params={},
        celery_task=task_id,
    )
    return result.model_dump()
