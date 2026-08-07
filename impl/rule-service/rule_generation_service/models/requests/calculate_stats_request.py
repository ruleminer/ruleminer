from typing import Optional
from typing import Union

from decision_rules.problem import ProblemTypes
from models.common import Attribute
from models.common import PredictionConfig
from pydantic import BaseModel


class CalculateStatsRequest(BaseModel):
    ruleset_kwargs: dict
    ruleset: Union[dict, list]
    problem_type: ProblemTypes
    dataset_storage_path: str
    algorithm_params: dict
    attributes: list[Attribute]
    rules_labels: Optional[dict[str, list[int]]] = {}
    overwrite_ruleset_id: Optional[int] = None
    prediction_config: PredictionConfig
    type_of_ruleset: Optional[str] = None
