from typing import Optional

from decision_rules.filtering import FilterAlgorithm
from decision_rules.problem import ProblemTypes
from models.common import PredictionConfig
from pydantic import BaseModel
from pydantic import model_validator


class FilterRulesetRequest(BaseModel):
    ruleset_kwargs: dict
    ruleset: dict
    filter_algorithm: FilterAlgorithm
    loss: float
    problem_type: ProblemTypes
    dataset_storage_path: str
    generation_params: dict
    rules_labels: Optional[dict[str, list[int]]]
    prediction_config: PredictionConfig

    @model_validator(mode="after")
    def validate(self):
        if self.prediction_config.voting_measure is None and self.problem_type != ProblemTypes.SURVIVAL:
            raise ValueError(
                "Voting measure is required for classification and regression problems."
            )
        return self
