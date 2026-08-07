from enum import Enum

from pydantic import Field

from .base import EMAGBaseModel


class BaseUnimportantAttributeEliminationSettings(EMAGBaseModel):
    """
    Unimportant attribute elimination settings.

    Attributes:
        I (float): threshold for id-ness
        S (float): threshold for stability
        M (float): threshold for missing
        T (float): threshold for textness
    """

    class Config:
        schema_name = "unimportant_attribute_elimination_settings"

    I: float = Field(0.9, ge=0.0, le=1.0)
    S: float = Field(0.9, ge=0.0, le=1.0)
    M: float = Field(0.9, ge=0.0, le=1.0)
    T: float = Field(0.9, ge=0.0, le=1.0)


class UnimportantAttributeEliminationSettings(BaseUnimportantAttributeEliminationSettings):
    """
    Unimportant attribute elimination settings for classification or regression problems.

    Attributes:
        I (float): threshold for id-ness
        S (float): threshold for stability
        M (float): threshold for missing
        T (float): threshold for textness
        use_low_correlation_attr_removal (bool): whether to use low correlation attribute removal
    """
    use_low_correlation_attr_removal: bool = False


class StrategyNumerical(str, Enum):
    MEAN = "mean"
    MEDIAN = "median"
    MOST_FREQUENT = "most_frequent"


class StrategyNominal(str, Enum):
    MOST_FREQUENT = "most_frequent"


class MissingValuesImputationSettings(EMAGBaseModel):
    """
    Missing values imputation settings.

    Attributes:
        strategy_numerical (StrategyNumerical): strategy for numerical attributes
        strategy_nominal (StrategyNominal): strategy for nominal attributes
    """
    strategy_numerical: StrategyNumerical = StrategyNumerical.MEAN
    strategy_nominal: StrategyNominal = StrategyNominal.MOST_FREQUENT


class Preprocessing(EMAGBaseModel):
    """
    Preprocessing settings.

    Attributes:
        unimportant_attribute_elimination (bool): whether to use unimportant attribute elimination
        unimportant_attribute_elimination_settings (UnimportantAttributeEliminationSettings): settings for unimportant attribute elimination
        missing_values_imputation (bool): whether to use missing values imputation
        missing_values_imputation_settings (MissingValuesImputationSettings): settings for missing values imputation
    """
    class Config:
        schema_name = "preprocessing"

    unimportant_attribute_elimination: bool = False
    unimportant_attribute_elimination_settings: UnimportantAttributeEliminationSettings = UnimportantAttributeEliminationSettings()
    missing_values_imputation: bool = True
    missing_values_imputation_settings: MissingValuesImputationSettings = MissingValuesImputationSettings()


class ClassificationPreprocessing(Preprocessing):
    """
    Preprocessing settings for classification problems.

    Attributes:
        unimportant_attribute_elimination (bool): whether to use unimportant attribute elimination
        unimportant_attribute_elimination_settings (UnimportantAttributeEliminationSettings): settings for unimportant attribute elimination
        missing_values_imputation (bool): whether to use missing values imputation
        missing_values_imputation_settings (MissingValuesImputationSettings): settings for missing values imputation
        decision_class_balancing (bool): whether to use decision class balancing
    """
    decision_class_balancing: bool = False


class RegressionPreprocessing(Preprocessing):
    pass


class SurvivalPreprocessing(Preprocessing):
    unimportant_attribute_elimination_settings: BaseUnimportantAttributeEliminationSettings = BaseUnimportantAttributeEliminationSettings()
