from dataclasses import dataclass
from typing import Optional
from uuid import UUID


@dataclass
class RulesetMeta:
    attributes: list[str]
    decision_attribute: str
    decision_attribute_distribution: dict
    survival_time_attribute: Optional[str] = None
    default_conclusion: Optional[dict] = None


@dataclass
class PremiseSubConditions:
    type: str
    attributes: list[int]
    negated: bool
    left: Optional[float]
    right: Optional[float]
    left_closed: bool
    right_closed: bool


@dataclass
class Premise:
    type: str
    operator: str
    subconditions: list[PremiseSubConditions]


@dataclass
class Conclusion:
    value: str


@dataclass
class Rule:
    uuid: UUID
    string: str
    premise: Premise
    conclusion: Conclusion


@dataclass
class Ruleset:
    meta: RulesetMeta
    rules: list[Rule]


@dataclass
class PredictionConfig:
    prediction_strategy: str
    use_default_rule: bool
    voting_measure: Optional[str] = None


@dataclass
class CreateRulesetRequest:
    name: str
    description: str
    generation_method: str
    attributes_to_skip: list[str]
    algorithm_id: int
    cross_validation: bool
    prediction_config: PredictionConfig
    expert_induction: Optional[dict] = None
    num_folds: Optional[int] = None
    algorithm_params: Optional[dict] = None
    survey: Optional[dict] = None
