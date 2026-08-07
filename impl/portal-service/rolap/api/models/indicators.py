from dataclasses import dataclass
from dataclasses import field
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Union

from django.db import models
from django.db.models import Q
from rolap.api.models.projects import Project
from rolap.api.models.rulesets.rulesets import PredictionConfig
from rolap.api.models.rulesets.rulesets import Ruleset

UUID = str


class IndicatorMeta(models.Model):
    """Model for storing meta data about indicators like: name, description,
    interpretation (lowe is better or higher is better), etc.
    """

    COMMON_FOR_ALL_PROBLEMS: str = None

    class Meta:
        unique_together = (
            "key",
            "type_of_problem",
        )

    class _Manager(models.Manager):

        _filter_common_for_all_problems: Q = Q(type_of_problem__isnull=True)

        def get_for_problem_type(self, type_of_problem: str) -> models.QuerySet:
            """Return all indicators meta that are common for all problems types
            """
            filter_for_problem_type = Q(type_of_problem=type_of_problem)
            return self.filter(
                self._filter_common_for_all_problems | filter_for_problem_type
            )

        def get_common_for_all_problem_types(self) -> models.QuerySet:
            """Return indicators meta that are common for all problems types
            """
            return self.filter(self._filter_common_for_all_problems)

    key: models.CharField = models.CharField(max_length=50)
    description_en = models.TextField(null=True, blank=True)
    description_pl = models.TextField(null=True, blank=True)
    type_of_problem: models.CharField = models.CharField(
        max_length=20,
        choices=Project.TYPE_OF_PROBLEM_CHOICES,
        blank=True,
        null=True,
        default=COMMON_FOR_ALL_PROBLEMS,
        db_index=True,
    )
    higher_is_better: models.BooleanField = models.BooleanField(default=True)

    objects = _Manager()


@dataclass
class RuleCoverage:
    pass


@dataclass
class ClassificationRuleCoverage:
    p: int
    n: int
    P: int
    N: int


@dataclass
class RegressionRuleCoverage(ClassificationRuleCoverage):
    train_covered_y_std: float
    train_covered_y_mean: float
    train_covered_y_min: float
    train_covered_y_max: float


@dataclass
class KaplanMeier:
    times: List[float]
    events_count: List[int]
    censored_count: List[int]
    at_risk_count: List[int]
    probabilities: List[float]


@dataclass
class SurvivalRuleCoverage(ClassificationRuleCoverage):
    median_survival_time: Any
    median_survival_time_ci_lower: Any
    median_survival_time_ci_upper: Any
    events_count: int
    censored_count: int
    log_rank: float
    kaplan_meier_estimator: KaplanMeier


@dataclass
class CalculateCharacteristicsRequest:
    """Request for calculating characteristics."""

    type: str
    voting_measure: str
    ruleset: Ruleset
    rule_coverage: Dict[UUID, RuleCoverage]
    dataset_path: Optional[str]


@dataclass
class QuantitativeCharacteristics:
    """Quantitative characteristics."""

    rules_count: int
    avg_conditions_count: float
    avg_precision: float
    avg_coverage: float
    total_conditions_count: int
    fraction_significant: Optional[float] = field(default=None)
    fraction_FDR_significant: Optional[float] = field(default=None)
    fraction_examples_covered: Optional[float] = field(default=None)


@dataclass
class CalculateIndicatorsRequest:
    """Request for calculating indicators."""

    type: str
    ruleset: Ruleset
    rule_coverage: Dict[UUID, RuleCoverage]
    dataset_path: str


@dataclass
class CalculateSingleRuleIndicatorsRequest:
    """Request for calculating single rule indicators."""

    type: str
    rule: dict
    attributes: list[str]
    decision_attribute: str
    dataset_path: str
    survival_time_attribute: Optional[str] = (None,)
    metrics_to_calculate: Optional[list[str]] = None


Indicator = dict[str, Union[int, float, str]]


@dataclass
class CalculateRulesetIndicator:
    """Request for calculating indicators for a ruleset."""

    rule_uuid: str
    indicators: List[Indicator]


@dataclass
class CalculateRuleCoverageRequest:
    """Request for calculating rule coverage."""

    dataset_path: str
    type: str
    ruleset: Ruleset


@dataclass
class CalculatePredictionIndicatorsRequest:
    dataset_path: str
    type: str
    ruleset: Ruleset
    rule_coverage: Dict[UUID, RuleCoverage]
    prediction_config: PredictionConfig


@dataclass
class CalculatePredictionIndicatorsResponse:
    type: str
    general: dict
    for_classes: dict
    histogram: dict


@dataclass
class RulesetWithCoverage:
    id: int
    name: str
    ruleset: dict
    rule_coverage: dict
    voting_measure: Optional[str]


@dataclass
class CalculatePredictionSummaryRequest:
    dataset_path: str
    type: str
    rulesets: list[RulesetWithCoverage]
    prediction_configs: list[PredictionConfig]


@dataclass
class CalculatePredictionSummaryResponse:
    id: int
    name: str
    indicators: dict


@dataclass
class CalculateImportanceRequest:
    dataset_path: str
    type: str
    measure: str
    voting_measure: str
    ruleset: Ruleset
    rule_coverage: dict


@dataclass
class ImportanceModel:
    condition_importance: dict
    attribute_importance: dict


@dataclass
class CalculateHistogramRequest:
    dataset_path: str
    type: str
    ruleset: dict
    bins: Optional[int]
    for_rules: Optional[List[str]]


@dataclass
class HistogramModel:
    max: int
    min: int
    bin_edges: List[float]
    histograms: Dict[str, List[int]]


@dataclass
class LocalExplainabilityResponse:
    covering_rules: dict
    decision: Union[str, float]


@dataclass
class LocalExplainabilityRequest:
    examples: list[dict]
    type: str
    ruleset: Ruleset
    rule_coverage: Dict[UUID, RuleCoverage]
    prediction_config: PredictionConfig


@dataclass
class CalculateRuleSimilarityRequest:
    dataset_path: str
    type: str
    measure: str
    ruleset1: dict
    ruleset2: dict
    similarity_type: str


@dataclass
class CalculateCoverageMatrixRequest:
    dataset_path: str
    type: str
    example_indices: list[int]
    ruleset: dict
    rule_coverage: dict[str, dict]
    prediction_config: PredictionConfig


@dataclass
class CalculatePredictionRequest:
    type: str
    ruleset: dict
    rule_coverage: dict[str, dict]
    prediction_config: PredictionConfig
    example_indices: Optional[list[int]] = None
    dataset_path: Optional[str] = None
    df_X: Optional[str] = None


@dataclass
class CalculateUniqueExamplesRequest:
    dataset_path: str
    type: str
    ruleset: dict
