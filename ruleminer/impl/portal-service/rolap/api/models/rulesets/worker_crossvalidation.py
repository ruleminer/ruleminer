from dataclasses import dataclass
from typing import Optional

from rolap.api.serializers.rulesets.rulesets import PredictionConfig

from .worker_rulesets import Attribute


@dataclass
class CreateCrossValidationWorkerRequest:
    ruleset_id: int
    dataset_id: int
    dataset_storage_path: str
    algorithm_params: dict
    algorithm_id: Optional[int]
    attributes: list[Attribute]
    num_folds: int
    prediction_config: PredictionConfig
