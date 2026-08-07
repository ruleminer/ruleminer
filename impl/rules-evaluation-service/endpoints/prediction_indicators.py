from decision_rules.core.ruleset import AbstractRuleSet
from fastapi import APIRouter
from rolap_data_storage.abstract import AbstractDatasetReader
from serializers.request import PredictionIndicatorsRequest
from storage import storage
from utils.clean import sanitize_data
from utils.predict import calculate_model_prediction_indicators
from utils.read import get_ruleset_with_coverage
from utils.read import read_dataset

router = APIRouter()


@router.post("/calculate_prediction_indicators")
async def calculate_prediction_indicators(request: PredictionIndicatorsRequest) -> dict:
    """Calculate prediction indicators for the submitted set of rules using the decision_rules package.

    Args:
        request (PredictionIndicatorsRequest)

    Returns:
        List[dict]: A list of dictionaries representing the calculated prediction indicators.
    """
    # get ruleset
    model: AbstractRuleSet = get_ruleset_with_coverage(
        request.ruleset, request.type, request.rule_coverage, request.prediction_config.voting_measure)

    # read dataset
    all_attributes: list[str] = model.column_names + [model.decision_attribute]
    dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
        path=request.dataset_path)
    dataset_reader.select_columns(columns=all_attributes)
    df = read_dataset(dataset_reader)
    X, y = model.split_dataset(df)

    indicators: dict = calculate_model_prediction_indicators(
        model, request.prediction_config, X, y
    )
    response_data = sanitize_data(indicators)
    return response_data
