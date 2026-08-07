from dataclasses import dataclass
from typing import Optional

from rolap.api.serializers.rulesets.rulesets import PredictionConfig


@dataclass
class Attribute:
    name: str
    role: str


@dataclass
class CreateRulesetWorkerRequest:
    name: str
    description: str
    generation_method: str
    algorithm_params: dict
    attributes: list[Attribute]
    algorithm_id: int
    dataset_id: int
    dataset_storage_path: str
    cross_validation: bool
    prediction_config: PredictionConfig
    num_folds: Optional[int] = None
    expert_induction: Optional[dict] = None


@dataclass
class SaveRulesetWorkerRequest:
    ruleset_kwargs: dict
    ruleset: dict
    problem_type: str
    dataset_storage_path: str
    algorithm_params: dict
    attributes: list[Attribute]
    rules_labels: dict[str, list[int]]
    prediction_config: PredictionConfig
    overwrite_ruleset_id: Optional[int] = None
    type_of_ruleset: Optional[str] = None


@dataclass
class FilterRulesetWorkerRequest:
    ruleset_kwargs: dict
    ruleset: dict
    filter_algorithm: str
    loss: Optional[float]
    problem_type: str
    dataset_storage_path: str
    generation_params: dict
    rules_labels: dict[str, list[int]]
    prediction_config: PredictionConfig
