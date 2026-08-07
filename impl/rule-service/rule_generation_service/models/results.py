from typing import Optional

from decision_rules.histogram import Histograms
from models.requests.create_ruleset_request import PredictionConfig
from pydantic import BaseModel
from pydantic import Field


class RulesetStatistics(BaseModel):
    rule_coverage: dict
    characteristics: dict
    rule_indicators: dict
    condition_importance: dict
    attribute_importance: dict
    prediction_indicators: dict
    rule_histograms: Optional[Histograms] = None
    calculation_time: float


class ApiRuleset(BaseModel):
    id: Optional[int] = None
    celery_task: int
    algorithm_id: int
    name: str
    description: str
    generation_params: dict = Field(default_factory=dict)
    ruleset: dict = Field(default_factory=dict)
    cross_validation: bool
    num_folds: Optional[int] = None

    attached_to_dataset_id: int
    generated_from_dataset_id: int

    generation_time: float
    extra_info: Optional[dict] = None

    statistics: RulesetStatistics
    prediction_config: PredictionConfig


class ApiCrossValidation(BaseModel):
    ruleset: int
    num_folds: int
    celery_task: int
    result: dict[str, dict]
    prediction_config: PredictionConfig
    extra_info: Optional[dict] = None


class ApiStatistics(BaseModel):
    ruleset_kwargs: dict
    ruleset: dict
    generation_params: dict
    statistics: RulesetStatistics
    celery_task: int
    rules_labels: dict[str, list[int]]
    prediction_config: PredictionConfig
    extra_info: Optional[dict] = None
    overwrite_ruleset_id: Optional[int] = None
    comments: Optional[list[dict]] = None
