from typing import Union

from pydantic import BaseModel


class ImportanceResponse(BaseModel):
    condition_importance: dict
    attribute_importance: dict


class CoverageMatrixResponse(BaseModel):
    coverage_matrix: dict
    prediction: list


class LocalExplainabilityResponse(BaseModel):
    covering_rules: dict[str, str]
    decision: Union[str, float, int, dict]


class PredictionSummaryResponse(BaseModel):
    id: int
    name: str
    indicators: dict
