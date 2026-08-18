from enum import Enum
from typing import Optional

from .base import EMAGBaseModel


class ProblemType(str, Enum):
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    SURVIVAL = "survival"


class DatasetSettings(EMAGBaseModel):
    """
    Dataset settings for report generation.

    Attributes:
        name (str): name of the dataset
        dataset (str): has to be passed as JSON string which is later read into pandas dataframe
        class_attribute (str): column name; in the case of survival, class has to be passed as JSON string like so:
        `{"event": <event_column_name>, "time": <time_column_name>}`
    """
    class Config:
        schema_name = "dataset_settings"

    name: str
    dataset: Optional[str] = None  # dataset is passed as JSON string
    class_attribute: str


class BaseReport(EMAGBaseModel):
    """
    Base class for all reports in EMAG reports library.

    Attributes:
        title (str): title of the report
        problem_type (ProblemType): type of the problem (classification, regression, survival)
        dataset (DatasetSettings): dataset settings for report generation
        preprocessing (EMAGBaseModel): preprocessing settings for report generation
        algorithms (EMAGBaseModel): algorithms settings for report generation
    """
    title: str
    problem_type: ProblemType
    dataset: DatasetSettings
    preprocessing: EMAGBaseModel
    algorithms: EMAGBaseModel

    def to_metadata(self) -> dict:
        """
        Converts model to dictionary with parameters e.g. to store in DB.

        Returns:
            dict: dictionary with preprocessing and algorithms settings of report
        """
        preprocessing = self.preprocessing.model_dump()
        keys = list(preprocessing.keys())
        for key in keys:
            settings_key = f"{key}_settings"
            if settings_key in preprocessing and not preprocessing[key]:
                preprocessing.pop(f"{key}_settings")
        algorithms = self.algorithms.model_dump()
        keys = list(algorithms.keys())
        for key in keys:
            settings_key = f"{key}_settings"
            if settings_key in algorithms and not algorithms[key]:
                algorithms.pop(f"{key}_settings")
        return {
            **preprocessing,
            **algorithms,
        }
