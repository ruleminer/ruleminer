import pandas as pd
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.problem import ProblemTypes
from fastapi import APIRouter
from rolap_data_storage.abstract import AbstractDatasetReader
from serializers.request import PredictionConfig
from serializers.request import PredictionSummaryRequest
from serializers.request import RulesetWithCoverage
from serializers.response import PredictionSummaryResponse
from storage import storage
from utils.clean import sanitize_data
from utils.predict import calculate_model_prediction_indicators
from utils.read import get_ruleset_with_coverage
from utils.read import read_dataset

router = APIRouter()


@router.post("/calculate_prediction_summary")
async def calculate_prediction_summary(request: PredictionSummaryRequest) -> list[PredictionSummaryResponse]:
    # read dataset for all rulesets
    dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
        path=request.dataset_path)
    df: pd.DataFrame = read_dataset(dataset_reader)

    # get prediction indicators
    response = []
    for ruleset, prediction_config in zip(request.rulesets, request.prediction_configs):
        indicators = _get_prediction_indicators(
            ruleset, df, request.type, prediction_config
        )
        indicators = sanitize_data(indicators)
        prediction_summary = PredictionSummaryResponse(
            id=ruleset.id,
            name=ruleset.name,
            indicators=indicators
        )
        response.append(prediction_summary)

    return response


def _get_prediction_indicators(
    ruleset: RulesetWithCoverage,
    dataset: pd.DataFrame,
    problem_type: ProblemTypes,
    prediction_config: PredictionConfig
) -> dict:
    # deserialize
    model: AbstractRuleSet = get_ruleset_with_coverage(
        ruleset.ruleset, problem_type, ruleset.rule_coverage, prediction_config.voting_measure)

    X, y = model.split_dataset(dataset)

    return calculate_model_prediction_indicators(
        model, prediction_config, X, y
    )
