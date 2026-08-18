import numpy as np
import pandas as pd
from decision_rules.core.ruleset import AbstractRuleSet
from fastapi import APIRouter
from serializers.request import CoverageMatrixRequest
from serializers.response import CoverageMatrixResponse
from utils.clean import sanitize_data
from utils.predict import predict_with_model
from utils.read import get_ruleset_with_coverage
from utils.read import read_filtered_dataset

router = APIRouter()


@router.post("/calculate_coverage_matrix")
async def calculate_coverage_matrix(
    request: CoverageMatrixRequest
) -> CoverageMatrixResponse:
    """Endpoint that calculates coverage matrix (and predictions) based on the provided
    dataset and ruleset.

    Args:
        request (CoverageMatrixRequest): Request body

    Returns:
        dict: A dictionary with two fields: coverage_matrix and prediction.
    """
    model: AbstractRuleSet = get_ruleset_with_coverage(
        request.ruleset,
        request.type,
        request.rule_coverage,
        request.prediction_config.voting_measure
    )
    X: pd.DataFrame = read_filtered_dataset(
        request.dataset_path,
        model.column_names,
        request.example_indices
    )
    coverage_matrix: np.ndarray = model.calculate_coverage_matrix(X)
    y_pred: np.ndarray = predict_with_model(
        model,
        coverage_matrix=coverage_matrix,
        prediction_config=request.prediction_config
    )
    response = CoverageMatrixResponse(
        coverage_matrix={
            rule.uuid: coverage_matrix[:, i].tolist() for i, rule in enumerate(model.rules)
        },
        prediction=sanitize_data(y_pred.tolist())
    )
    return response
