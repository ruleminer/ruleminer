import numpy as np
import pandas as pd
from decision_rules.core.ruleset import AbstractRuleSet
from fastapi import APIRouter
from serializers.request import LocalExplainabilityRequest
from serializers.response import LocalExplainabilityResponse
from utils.clean import sanitize_data
from utils.predict import predict_with_model
from utils.read import get_ruleset_with_coverage

router = APIRouter()


@router.post("/local_explainability")
async def local_explainability(request: LocalExplainabilityRequest) -> list[LocalExplainabilityResponse]:
    """Endpoint that calculates predictions based on the provided dataset and ruleset.

    Args:
        request (LocalExplainabilityRequest)

    Returns:
        List[LocalExplainabilityResponse]: A list of object containing information about
            rules covering each example and model predictions.
    """
    model: AbstractRuleSet = get_ruleset_with_coverage(
        request.ruleset,
        request.type,
        request.rule_coverage,
        request.prediction_config.voting_measure
    )
    X = pd.DataFrame(request.examples).fillna(value=np.nan)
    rules_array = np.array(model.rules)
    # coverage matrix contains info about which rules cover each example
    coverage_matrix: np.ndarray = model.calculate_coverage_matrix(X)
    # prediction using coverage matrix is super fast
    prediction: np.ndarray = predict_with_model(
        model,
        coverage_matrix=coverage_matrix,
        prediction_config=request.prediction_config
    )
    return [
        LocalExplainabilityResponse(
            covering_rules={
                rule.uuid: str(rule)
                for rule in rules_array[coverage_matrix[i, :]]
            },
            decision=sanitize_data(prediction[i])
        )
        for i in range(len(request.examples))
    ]
