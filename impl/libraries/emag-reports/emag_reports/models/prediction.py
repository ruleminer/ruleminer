from enum import Enum
from typing import Optional

from pydantic import Field

from .base import EMAGBaseModel
from .common import BaseReport
from .preprocess import ClassificationPreprocessing
from .preprocess import Preprocessing
from .preprocess import RegressionPreprocessing
from .preprocess import SurvivalPreprocessing


class ClassificationScoring(str, Enum):
    BALANCED_ACCURACY = "balanced_accuracy"
    F1_SCORE = "f1_weighted"
    ROC_AUC = "roc_auc_ovo"
    PRECISION = "precision_weighted"
    RECALL = "recall_weighted"


class RegressionScoring(str, Enum):
    NEG_MEAN_SQUARED_ERROR = "neg_mean_squared_error"
    NEG_MEAN_ABSOLUTE_ERROR = "neg_mean_absolute_error"
    R2 = "r2"
    EXPLAINED_VARIANCE = "explained_variance"


class SurvivalScoring(str, Enum):
    C_INDEX = "c_index"


class GridSearchSettings(EMAGBaseModel):
    class Config:
        schema_name = "grid_search_settings"

    scoring: str


class ClassificationGridSearchSettings(GridSearchSettings):
    scoring: ClassificationScoring = ClassificationScoring.BALANCED_ACCURACY


class RegressionGridSearchSettings(GridSearchSettings):
    scoring: RegressionScoring = RegressionScoring.NEG_MEAN_SQUARED_ERROR


class SurvivalGridSearchSettings(GridSearchSettings):
    scoring: SurvivalScoring = SurvivalScoring.C_INDEX


class PredictionSettings(EMAGBaseModel):
    """
    Settings for prediction reports.

    Attributes:
        analysis_mode (AnalysisMode): analysis mode (train-test or cross-validation)
        test_size (float): size of the test set
        grid_search (bool): whether to perform grid search
        grid_search_settings (GridSearchSettings): settings for grid search
    """
    class Config:
        schema_name = "settings"

    class AnalysisMode(str, Enum):
        TRAIN_TEST = "TT"
        CROSS_VALIDATION = "CV"

    analysis_mode: AnalysisMode = AnalysisMode.TRAIN_TEST
    test_size: Optional[float] = Field(default=0.3, ge=0.01, le=0.99)
    grid_search: bool = False
    grid_search_settings: GridSearchSettings

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.analysis_mode == self.AnalysisMode.TRAIN_TEST:
            self.test_size = self.test_size or 0.3
        else:
            self.test_size = None


class ClassificationSettings(PredictionSettings):
    grid_search_settings: ClassificationGridSearchSettings = ClassificationGridSearchSettings()


class RegressionSettings(PredictionSettings):
    grid_search_settings: RegressionGridSearchSettings = RegressionGridSearchSettings()


class SurvivalSettings(PredictionSettings):
    grid_search_settings: SurvivalGridSearchSettings = SurvivalGridSearchSettings()


class PredictionAlgorithms(EMAGBaseModel):
    class Config:
        schema_name = "algorithms"


class PredictionClassificationAlgorithms(PredictionAlgorithms):
    """
    Algorithms for prediction in classification problems.

    Attributes:
        logistic_regression (bool): whether to use logistic regression
        decision_tree (bool): whether to use decision tree
        random_forest (bool): whether to use random forest
        knn (bool): whether to use k-nearest neighbors
        naive_bayes (bool): whether to use naive Bayes
        svm (bool): whether to use support vector machine
        gradient_boosting (bool): whether to use gradient boosting

    """
    logistic_regression: bool = True
    decision_tree: bool = True
    random_forest: bool = False
    knn: bool = False
    naive_bayes: bool = False
    svm: bool = False
    gradient_boosting: bool = True


class PredictionRegressionAlgorithms(PredictionAlgorithms):
    """
    Algorithms for prediction in regression problems.

    Attributes:
        linear_regression (bool): whether to use linear regression
        decision_tree (bool): whether to use decision tree
        random_forest (bool): whether to use random forest
        knn (bool): whether to use k-nearest neighbors
        svm (bool): whether to use support vector machine
        gradient_boosting (bool): whether to use gradient boosting
    """
    linear_regression: bool = True
    decision_tree: bool = True
    random_forest: bool = False
    knn: bool = False
    svm: bool = False
    gradient_boosting: bool = True


class PredictionSurvivalAlgorithms(PredictionAlgorithms):
    """
    Algorithms for prediction in survival problems.

    Attributes:
        cox_proportional_hazard (bool): whether to use Cox proportional hazard model
        decision_tree (bool): whether to use decision tree
        random_forest (bool): whether to use random forest
        svm (bool): whether to use support vector machine
        gradient_boosting (bool): whether to use gradient boosting
    """
    cox_proportional_hazard: bool = True
    decision_tree: bool = True
    random_forest: bool = False
    svm: bool = False
    gradient_boosting: bool = True


class PredictionReport(BaseReport):
    """
    Base class for all prediction reports in EMAG reports library.

    Attributes:
        title (str): title of the report
        problem_type (ProblemType): type of the problem (classification, regression, survival)
        dataset (DatasetSettings): dataset settings for report generation
        settings (PredictionSettings): settings for prediction reports
        preprocessing (Preprocessing): preprocessing settings for prediction reports
        algorithms (EMAGBaseModel): algorithms settings for prediction reports
    """
    class Config:
        schema_name = "prediction_report"

    settings: PredictionSettings
    preprocessing: Preprocessing
    algorithms: EMAGBaseModel

    def to_metadata(self):
        metadata = super().to_metadata()
        settings = self.settings.model_dump()
        keys = list(settings.keys())
        for key in keys:
            settings_key = f"{key}_settings"
            if settings_key in settings and not settings[key]:
                settings.pop(f"{key}_settings")
        return {
            **metadata,
            **settings,
        }


class ClassificationPredictionReport(PredictionReport):
    settings: ClassificationSettings = ClassificationSettings()
    preprocessing: ClassificationPreprocessing = ClassificationPreprocessing()
    algorithms: PredictionClassificationAlgorithms = PredictionClassificationAlgorithms()


class RegressionPredictionReport(PredictionReport):
    settings: RegressionSettings = RegressionSettings()
    preprocessing: RegressionPreprocessing = RegressionPreprocessing()
    algorithms: PredictionRegressionAlgorithms = PredictionRegressionAlgorithms()


class SurvivalPredictionReport(PredictionReport):
    settings: SurvivalSettings = SurvivalSettings()
    preprocessing: SurvivalPreprocessing = SurvivalPreprocessing()
    algorithms: PredictionSurvivalAlgorithms = PredictionSurvivalAlgorithms()
