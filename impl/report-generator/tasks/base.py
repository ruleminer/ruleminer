import io
import os
import shutil

from emag_reports.generate import generate_report
from emag_reports.models.discovery import DiscoveryReport
from emag_reports.models.prediction import PredictionReport
from exceptions import ReportGenerationError
from exceptions import ReportNotImplementedError
from results import ReportGenerationResult
from utils.reports_sftp import put_report_file


def generate_report_from_emag(
        request: DiscoveryReport or PredictionReport,
        task_id: int,
        dataset_id: int
) -> dict:
    """
    Base method for tasks generating EMAG-type reports.

    Args:
        request (DiscoveryReport or PredictionReport): report request containing parameters
        task_id (int): ID of the task
        dataset_id (int): ID of the dataset

    Returns:
        dict: result of the report generation
    """
    # generate report name
    if isinstance(request, DiscoveryReport):
        name = f"discovery_dataset_{dataset_id}_task_{task_id}"
        report_type = "WHITEBOX"
    elif isinstance(request, PredictionReport):
        name = f"prediction_dataset_{dataset_id}_task_{task_id}"
        report_type = "PREDICTION"
    else:
        raise ReportNotImplementedError()
    filename = f"{name}"

    # generate report
    try:
        report_file = generate_report(request, filename)
    except Exception as e:
        raise ReportGenerationError(e)
    report_path = f"reports/{report_file}"

    if not os.path.exists(report_file):
        raise ReportGenerationError()

    # write the report to SFTP server
    with open(report_file, "rb") as file:
        report_bytes = io.BytesIO(file.read())
        put_report_file(report_bytes, report_path)
    os.remove(report_file)

    # remove working files
    working_files = [file for file in os.listdir() if f"{name}_exec" in file]
    for file in working_files:
        if os.path.isfile(file):
            os.remove(file)
        else:
            shutil.rmtree(file)

    # return result
    result = ReportGenerationResult(
        dataset_id=dataset_id,
        storage_path=report_path,
        type=report_type,
        title=request.title,
        generation_params=request.to_metadata(),
        celery_task=task_id,
    )
    return result.model_dump()
