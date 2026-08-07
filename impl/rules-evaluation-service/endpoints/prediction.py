import numpy as np
import pandas as pd
from decision_rules.core.ruleset import AbstractRuleSet
from fastapi import APIRouter
from fastapi import HTTPException
from serializers.request import PredictionRequest
from utils.clean import sanitize_data
from utils.predict import predict_with_model
from utils.read import get_ruleset_with_coverage
from utils.read import read_filtered_dataset

router = APIRouter()


@router.post("/calculate_prediction")
async def calculate_prediction(request: PredictionRequest) -> list:
    """Endpoint that calculates predictions based on the provided dataset and ruleset.

    Args:
        request (PredictionRequest)

    Returns:
        list: A list of the predictions in the same orders as the examples indices in the request.
    """
    # deserialize ruleset
    model: AbstractRuleSet = get_ruleset_with_coverage(
        request.ruleset,
        request.type,
        request.rule_coverage,
        request.prediction_config.voting_measure
    )
    # read dataset
    if request.df_X is None:
        if not request.dataset_path:
            raise HTTPException(
                status_code=400, detail="Dataset path is required if no DataFrame provided.")
        X: pd.DataFrame = read_filtered_dataset(
            request.dataset_path,
            model.column_names,
            request.example_indices)
    else:
        try:
            # Deserialize DataFrame from JSON string
            X = pd.read_json(request.df_X)
        except ValueError as e:
            raise HTTPException(
                status_code=400, detail=f"Error in parsing DataFrame JSON: {str(e)}")
    if X.shape[0] == 0:
        return []
    # make prediction
    y_pred: np.ndarray = predict_with_model(
        model, X=X, prediction_config=request.prediction_config
    )
    # return response
    return sanitize_data(y_pred.tolist())
