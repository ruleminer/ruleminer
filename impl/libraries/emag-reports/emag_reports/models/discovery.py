from typing import Literal
from typing import Optional

from pydantic import Field

from .base import EMAGBaseModel
from .common import BaseReport
from .preprocess import ClassificationPreprocessing
from .preprocess import Preprocessing
from .preprocess import RegressionPreprocessing
from .preprocess import SurvivalPreprocessing


class TreesSettings(EMAGBaseModel):
    """
    Settings for tree-based algorithms.

    Attributes:
        max_depth (int): maximum depth of the tree
    """
    max_depth: Optional[int] = Field(default=5, ge=1)


class RulesSettings(EMAGBaseModel):
    """
    Settings for rule-based algorithms.

    Attributes:
        min_covered_examples (int): minimum number of examples covered by a rule
        max_rule_length (int): maximum length of a rule
        beam_width (int): width of the beam search
    """
    min_covered_examples: int = Field(5, ge=1)
    max_rule_length: int = Field(5, ge=1)
    beam_width: int = Field(10, ge=1)


class BaseItemsetsAndAssociationsSettings(EMAGBaseModel):
    """
    Settings for itemset mining and association rule mining algorithms.

    Attributes:
        max_intervals_value (int): maximum number of intervals
        max_k_value (int): maximum value of k
        min_supp (float): minimum support
        min_confidence (float): minimum confidence
    """
    class Config:
        schema_name = "itemsets_and_associations_settings"

    max_intervals_value: int = Field(10, ge=1)
    max_k_value: int = Field(3, ge=1)
    min_supp: float = Field(0.01, ge=0.0, le=1)
    min_confidence: float = Field(0.5, ge=0.0, le=1)
    max_rows: int = Field(500, ge=1, le=1000)


class ItemsetsAndAssociationsSettings(BaseItemsetsAndAssociationsSettings):
    """
    Settings for classification itemset mining and association rule mining algorithms.

    Attributes:
        max_k_value (int): maximum value of k
        max_intervals_value (int): maximum number of intervals
        min_confidence (float): minimum confidence
        min_supp (float): minimum support
        exclude_target_column (bool): whether to exclude target column
    """
    exclude_target_column: bool = False


class SurvivalItemsetsAndAssociationsSettings(BaseItemsetsAndAssociationsSettings):
    exclude_target_column: Literal[True] = True


class DiscoveryAlgorithms(EMAGBaseModel):
    class Config:
        schema_name = "algorithms"


class DiscoveryClassificationAlgorithms(DiscoveryAlgorithms):
    """
    Algorithms for discovery in classification problems.

    Attributes:
        trees (bool): whether to use tree-based algorithms
        trees_settings (TreeSettings): settings for tree-based algorithms
        rules (bool): whether to use rule-based algorithms
        rules_settings (RulesSettings): settings for rule-based algorithms
        itemsets_and_associations (bool): whether to use itemset mining and association rule mining algorithms
        itemsets_and_associations_settings (ItemsetsAndAssociationsSettings): settings for itemset mining and association rule mining algorithms

    """
    trees: bool = True
    trees_settings: TreesSettings = TreesSettings()
    rules: bool = True
    rules_settings: RulesSettings = RulesSettings()
    itemsets_and_associations: bool = True
    itemsets_and_associations_settings: ItemsetsAndAssociationsSettings = ItemsetsAndAssociationsSettings()


class DiscoveryRegressionAlgorithms(DiscoveryAlgorithms):
    """
    Algorithms for discovery in regression problems.

    Attributes:
        trees (bool): whether to use tree-based algorithms
        trees_settings (TreeSettings): settings for tree-based algorithms
        rules (bool): whether to use rule-based algorithms
        itemsets_and_associations (bool): whether to use itemset mining and association rule mining algorithms
        itemsets_and_associations_settings (ItemsetsAndAssociationsSettings): settings for itemset mining and association rule mining algorithms
    """
    trees: bool = True
    trees_settings: TreesSettings = TreesSettings()
    rules: bool = True
    itemsets_and_associations: bool = True
    itemsets_and_associations_settings: ItemsetsAndAssociationsSettings = ItemsetsAndAssociationsSettings()


class DiscoverySurvivalAlgorithms(DiscoveryAlgorithms):
    """
    Algorithms for discovery in survival problems.

    Attributes:
        cox_proportional_hazard (bool): whether to use Cox proportional hazard model
        trees (bool): whether to use tree-based algorithms
        trees_settings (TreeSettings): settings for tree-based algorithms
        itemsets_and_associations (bool): whether to use itemset mining and association rule mining algorithms
        itemsets_and_associations_settings (SurvivalItemsetsAndAssociationsSettings): settings for itemset mining and association rule mining algorithms
    """
    cox_proportional_hazard: bool = True
    trees: bool = True
    trees_settings: TreesSettings = TreesSettings()
    itemsets_and_associations: bool = True
    itemsets_and_associations_settings: SurvivalItemsetsAndAssociationsSettings = SurvivalItemsetsAndAssociationsSettings()


class DiscoveryReport(BaseReport):
    """
    Report for discovery of the dataset.

    Attributes:
        title (str): title of the report
        problem_type (ProblemType): type of the problem (classification, regression, survival)
        dataset (DatasetSettings): dataset settings for report generation
        preprocessing (Preprocessing): preprocessing settings
        algorithms (EMAGBaseModel): algorithms settings
    """
    class Config:
        schema_name = "discovery_report"

    preprocessing: Preprocessing
    algorithms: EMAGBaseModel


class DiscoveryClassificationReport(DiscoveryReport):
    preprocessing: ClassificationPreprocessing = ClassificationPreprocessing()
    algorithms: DiscoveryClassificationAlgorithms = DiscoveryClassificationAlgorithms()


class DiscoveryRegressionReport(DiscoveryReport):
    preprocessing: RegressionPreprocessing = RegressionPreprocessing()
    algorithms: DiscoveryRegressionAlgorithms = DiscoveryRegressionAlgorithms()


class DiscoverySurvivalReport(DiscoveryReport):
    preprocessing: SurvivalPreprocessing = SurvivalPreprocessing()
    algorithms: DiscoverySurvivalAlgorithms = DiscoverySurvivalAlgorithms()
