from __future__ import annotations

from typing import Optional

import pandas as pd
from decision_rules.problem import ProblemTypes
from decision_rules.similarity import SimilarityMeasure
from decision_rules.similarity import SimilarityType
from pydantic import BaseModel
from pydantic import model_validator
from pydantic import ValidationError
from serializers.common import Rule
from serializers.common import Ruleset


class PredictionConfig(BaseModel):
    prediction_strategy: str
    use_default_rule: bool
    voting_measure: Optional[str] = None


class MeasureValidationMixin(BaseModel):
    @model_validator(mode="after")
    def validate(self):
        if "prediction_config" in self.model_fields:
            voting_measure = self.prediction_config.voting_measure
        else:
            voting_measure = self.voting_measure
        if voting_measure is None and self.type != ProblemTypes.SURVIVAL:
            raise ValueError(
                "Voting measure is required for classification and regression problems."
            )
        return self


class ConditionImportanceRequest(MeasureValidationMixin, BaseModel):
    ruleset: Ruleset
    type: ProblemTypes
    dataset_path: str
    rule_coverage: dict
    voting_measure: Optional[str] = None


class CoverageMatrixRequest(MeasureValidationMixin, BaseModel):
    dataset_path: str
    type: ProblemTypes
    ruleset: Ruleset
    rule_coverage: dict
    example_indices: Optional[list[int]] = None
    prediction_config: PredictionConfig


class HistogramRequest(BaseModel):
    dataset_path: str
    type: ProblemTypes
    for_rules: list[str] = []
    bins: int
    ruleset: Ruleset


class LocalExplainabilityRequest(MeasureValidationMixin, BaseModel):
    type: ProblemTypes
    ruleset: Ruleset
    examples: list[dict]
    rule_coverage: dict
    prediction_config: PredictionConfig


class PredictionRequest(MeasureValidationMixin, BaseModel):
    dataset_path: Optional[str] = None
    type: ProblemTypes
    ruleset: Ruleset
    rule_coverage: dict
    example_indices: Optional[list[int]] = None
    prediction_config: PredictionConfig
    df_X: Optional[str] = None

    @model_validator(mode="after")
    def validate(self):
        if self.df_X is None and self.dataset_path is None:
            raise ValueError("Either dataset_path or df_X must be provided.")
        return self


class PredictionIndicatorsRequest(MeasureValidationMixin, BaseModel):
    dataset_path: str
    type: ProblemTypes
    ruleset: Ruleset
    rule_coverage: dict
    prediction_config: PredictionConfig


class RulesetWithCoverage(BaseModel):
    id: int
    name: str
    ruleset: Ruleset
    rule_coverage: dict
    voting_measure: Optional[str] = None


class PredictionSummaryRequest(BaseModel):
    dataset_path: str
    type: ProblemTypes
    rulesets: list[RulesetWithCoverage]
    prediction_configs: list[PredictionConfig]

    @model_validator(mode='after')
    def check_if_rulesets_and_prediction_configs_lengths_match(self) -> PredictionSummaryRequest:
        if len(self.rulesets) != len(self.prediction_configs):
            raise ValueError(
                '"rulesets" and "prediction_configs" lists must have the same length.'
            )
        return self


class QuantitativeCharacteristicRequest(MeasureValidationMixin, BaseModel):
    dataset_path: str
    type: ProblemTypes
    voting_measure: Optional[str] = None
    ruleset: Ruleset
    rule_coverage: dict


class RuleCoverageRequest(BaseModel):
    dataset_path: str
    type: ProblemTypes
    ruleset: Ruleset


class RulesIndicatorsRequest(BaseModel):
    dataset_path: str
    type: ProblemTypes
    ruleset: Ruleset
    rule_coverage: dict


class SingleRuleIndicatorsRequest(BaseModel):
    type: ProblemTypes
    rule: Rule
    attributes: list[str]
    decision_attribute: str
    survival_time_attribute: Optional[str] = None,
    dataset_path: str
    metrics_to_calculate: Optional[list[str]] = None

    def get_column_names(self) -> list[str]:
        if self.survival_time_attribute is None:
            return self.attributes
        else:
            return self.attributes + [self.survival_time_attribute]


class RuleSimilarityRequest(BaseModel):
    dataset_path: str
    type: ProblemTypes
    ruleset1: Ruleset
    ruleset2: Ruleset
    similarity_type: SimilarityType
    measure: Optional[SimilarityMeasure] = None


class UniqueExamplesRequest(BaseModel):
    dataset_path: str
    type: ProblemTypes
    ruleset: Ruleset


class UniqueExamples(BaseModel):
    uuid: str
    ids: list[int]
    p_unique: int
    n_unique: Optional[int] = None
