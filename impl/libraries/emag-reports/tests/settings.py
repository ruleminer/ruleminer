import json

from emag_reports.models import ProblemType
from emag_reports.models.discovery import DiscoveryClassificationReport
from emag_reports.models.discovery import DiscoveryRegressionReport
from emag_reports.models.discovery import DiscoverySurvivalReport
from emag_reports.models.prediction import ClassificationPredictionReport
from emag_reports.models.prediction import RegressionPredictionReport
from emag_reports.models.prediction import SurvivalPredictionReport


"""
This file stores information about datasets used in the test suite.
It also contains a mapping of problem and report types to report parameter classes.

In order to add a new dataset, you need to add a new entry to the DATASET_MAPPING dictionary,
and add appropriate new methods in the test case class.
"""


DATASET_MAPPING = {
    "diabetes": (
        "diabetes.csv",
        "class",
        ProblemType.CLASSIFICATION,
    ),
    "iris": (
        "iris.csv",
        "target",
        ProblemType.CLASSIFICATION,
    ),
    "zoo": (
        "zoo.csv",
        "class",
        ProblemType.CLASSIFICATION,
    ),
    "boston": (
        "boston.csv",
        "MEDV",
        ProblemType.REGRESSION,
    ),
    "california": (
        "california.csv",
        "MedHouseVal",
        ProblemType.REGRESSION,

    ),
    "diabetes_reg": (
        "diabetes_reg.csv",
        "target",
        ProblemType.REGRESSION,
    ),
    "bone_marrow": (
        "bone_marrow.csv",
        json.dumps({"event": "survival_status", "time": "survival_time"}),
        ProblemType.SURVIVAL,
    ),
    "BHS": (
        "BHS.csv",
        json.dumps({"event": "survival_status", "time": "survival_time"}),
        ProblemType.SURVIVAL,
    ),
    "veteran": (
        "veteran.csv",
        json.dumps({"event": "Survival_status", "time": "Survival_time"}),
        ProblemType.SURVIVAL,
    ),
}

REPORT_MAPPING = {
    ProblemType.CLASSIFICATION: {
        "discovery": DiscoveryClassificationReport,
        "prediction": ClassificationPredictionReport,
    },
    ProblemType.REGRESSION: {
        "discovery": DiscoveryRegressionReport,
        "prediction": RegressionPredictionReport,
    },
    ProblemType.SURVIVAL: {
        "discovery": DiscoverySurvivalReport,
        "prediction": SurvivalPredictionReport,
    },
}
