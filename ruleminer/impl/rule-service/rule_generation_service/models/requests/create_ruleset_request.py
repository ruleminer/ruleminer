import os
from typing import Any
from typing import Optional

from models.common import Attribute
from models.common import PredictionConfig
from pydantic import BaseModel
from pydantic import field_validator
from pydantic.types import constr


class CreateRulesetRequest(BaseModel):
    name: constr(strip_whitespace=True,
                 pattern=os.environ['RULESET_NAME_REGEX'])
    description: constr(strip_whitespace=True)
    generation_method: constr(strip_whitespace=True,
                              pattern=r'^[a-zA-Z0-9\s\-_]+$')
    algorithm_params: dict
    attributes: list[Attribute]
    cross_validation: bool
    prediction_config: PredictionConfig
    num_folds: Optional[int]
    algorithm_id: int
    dataset_id: int
    dataset_storage_path: str
    expert_induction: Optional[dict] = None

    @field_validator('dataset_id')
    def validate_dataset_id(cls, dataset_id: int) -> int:
        if dataset_id <= 0:
            raise ValueError("dataset_id must be greater than 0.")
        return dataset_id

    @field_validator('algorithm_id')
    def validate_algorithm_id(cls, algorithm_id: int) -> int:
        if algorithm_id <= 0:
            raise ValueError("algorithm_id must be greater than 0.")
        return algorithm_id

    @classmethod
    def validate_request(cls, request: dict[str, Any]):
        ruleset_request = CreateRulesetRequest.model_validate(request)
        return ruleset_request
