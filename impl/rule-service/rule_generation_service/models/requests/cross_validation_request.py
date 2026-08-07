from typing import Any
from typing import Optional

from models.common import Attribute
from models.common import PredictionConfig
from pydantic import BaseModel


class CrossValidationRequest(BaseModel):
    ruleset_id: int
    dataset_id: int
    dataset_storage_path: str
    algorithm_params: dict
    algorithm_id: Optional[int]
    attributes: list[Attribute]
    num_folds: int
    prediction_config: PredictionConfig
    expert_induction: Optional[dict] = None

    @classmethod
    def validate_request(cls, request: dict[str, Any]):
        ruleset_request = CrossValidationRequest.model_validate(request)
        return ruleset_request
