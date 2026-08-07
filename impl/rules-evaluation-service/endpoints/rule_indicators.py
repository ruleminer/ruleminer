from typing import Any

from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.problem import ProblemTypes
from decision_rules.survival.ruleset import SurvivalRuleSet
from fastapi import APIRouter
from fastapi import HTTPException
from rolap_data_storage.abstract import AbstractDatasetReader
from serializers.request import RulesIndicatorsRequest
from serializers.request import SingleRuleIndicatorsRequest
from storage import storage
from utils.clean import sanitize_data
from utils.read import deserialize_ruleset
from utils.read import read_dataset
from utils.read import RulesetFromRuleFactory

router = APIRouter()

EXCLUDED_METRICS: list[str] = [
    "p_unique", "n_unique", "all_unique",
    "unique_in_pos", "unique_in_neg", "unique"
]


@router.post("/calculate_rules_indicators")
async def calculate_rules_indicators(request: RulesIndicatorsRequest) -> dict:
    """Calculates the indicators for the submitted set of rules.

    Args:
        request (RuleIndicatorsRequest)

    Returns:
        list[dict]: A list of dictionaries containing the rule UUIDs and their indicators.
    """
    # read ruleset
    model: AbstractRuleSet = deserialize_ruleset(
        request.ruleset, request.type)

    # read dataset
    all_attributes: list[str] = [model.decision_attribute] + model.column_names
    dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
        path=request.dataset_path)
    dataset_reader.select_columns(columns=all_attributes)
    df = read_dataset(dataset_reader)

    # get metrics
    if request.type == ProblemTypes.SURVIVAL:
        rules_coverages: dict[str, Any] = request.rule_coverage
        model.update_using_coverages(rules_coverages)
    X, y = model.split_dataset(df)

    supported_metrics = model.get_metrics_object_instance().supported_metrics
    filtered_metrics = [
        metric for metric in supported_metrics if metric not in EXCLUDED_METRICS]

    data: dict = model.calculate_rules_metrics(
        X, y, metrics_to_calculate=filtered_metrics)
    data: dict = sanitize_data(data)

    return data


@router.post("/calculate_single_rule_indicators")
async def calculate_single_rule_indicators(request: SingleRuleIndicatorsRequest) -> dict:
    """Calculates the indicators for the single rule.

    Args:
        request (SingleRuleIndicatorsRequest)

    Returns:
        dict: A dictionaries containing the rule indicators.
    """
    # read ruleset
    column_names: list[str] = request.get_column_names()
    ruleset_factory = RulesetFromRuleFactory(problem_type=request.type)
    model: AbstractRuleSet = ruleset_factory.make(
        rule=request.rule.model_dump(),
        column_names=column_names,
        decision_attribute=request.decision_attribute,
        survival_time_attribute=request.survival_time_attribute
    )
    # read dataset
    dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
        path=request.dataset_path)
    dataset_reader.select_columns(column_names + [request.decision_attribute])
    df = read_dataset(dataset_reader)
    X, y = (
        df.drop(request.decision_attribute, axis=1),
        df[request.decision_attribute]
    )
    # get metrics - do not include `p_unique` and `n_unique`

    def metrics_filter(x): return x not in EXCLUDED_METRICS

    supported_metrics = model.get_metrics_object_instance().supported_metrics
    supported_metrics = list(filter(metrics_filter, supported_metrics))
    metrics_to_calculate = request.metrics_to_calculate
    if metrics_to_calculate is None:
        metrics_to_calculate = supported_metrics
    else:
        invalid_metrics = set(
            metrics_to_calculate).difference(supported_metrics)
        if len(invalid_metrics) > 0:
            raise HTTPException(
                status_code=400,
                detail=f'Unsupported metrics: "{invalid_metrics}". '
                f'Supported metrics for this type of ruleset are: '
                f'{", ".join(supported_metrics)}'
            )
    try:
        data: dict = model.calculate_rules_metrics(
            X, y, metrics_to_calculate=metrics_to_calculate)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        ) from e
    return sanitize_data(data[request.rule.uuid])
