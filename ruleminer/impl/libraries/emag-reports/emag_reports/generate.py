import os
import pathlib
import uuid

from emag_reports.file_utils import create_temp_execution_file
from emag_reports.models.discovery import DiscoveryClassificationReport
from emag_reports.models.discovery import DiscoveryRegressionReport
from emag_reports.models.discovery import DiscoveryReport
from emag_reports.models.discovery import DiscoverySurvivalReport
from emag_reports.models.prediction import ClassificationPredictionReport
from emag_reports.models.prediction import PredictionReport
from emag_reports.models.prediction import RegressionPredictionReport
from emag_reports.models.prediction import SurvivalPredictionReport
from emag_reports.quarto import render


REPORT_FILE_MAPPING = {
    ClassificationPredictionReport: "prediction_notebooks/prediction-classification.ipynb",
    RegressionPredictionReport: "prediction_notebooks/prediction-regression.ipynb",
    SurvivalPredictionReport: "prediction_notebooks/prediction-survival.ipynb",
    DiscoveryClassificationReport: "discovery_notebooks/discovery-classification.ipynb",
    DiscoveryRegressionReport: "discovery_notebooks/discovery-regression.ipynb",
    DiscoverySurvivalReport: "discovery_notebooks/discovery-survival.ipynb",
}

MODULE_PATH = pathlib.Path(__file__).parent


def generate_report(
        request: PredictionReport or DiscoveryReport,
        report_filename: str = None
) -> str:
    """
    Generate a report based on the request

    Args:
        request (PredictionReport or DiscoveryReport): request object containing the parameters for the report
        report_filename (str): name of the target report file

    Returns:
        str: The path to the generated report
    """
    source_notebook_file = get_source_notebook(request)
    if report_filename is None:
        report_filename = uuid.uuid4()
    target_file = f"{report_filename}.html"
    with create_temp_execution_file(source_notebook_file, report_filename) as temp_file:
        render(
            input_file=temp_file,
            output_file=target_file,
            execute_params=request.to_params(),
        )
    return target_file


def get_source_notebook(request: PredictionReport or DiscoveryReport) -> str:
    """
    Get the path to the source notebook for report generation

    Args:
        request (PredictionReport or DiscoveryReport): request object containing the parameters for the report

    Returns:
        str: The path to the source notebook
    """
    return os.path.join(
        MODULE_PATH,
        REPORT_FILE_MAPPING[type(request)]
    )
