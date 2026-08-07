from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.problem import ProblemTypes
from fastapi import APIRouter
from rolap_data_storage.abstract import AbstractDatasetReader
from serializers.request import RuleCoverageRequest
from storage import storage
from utils.clean import sanitize_data
from utils.read import deserialize_ruleset
from utils.read import read_dataset

router = APIRouter()


@router.post("/calculate_rule_coverage")
async def calculate_rule_coverage(request: RuleCoverageRequest) -> dict:
    """Calculates rule coverage for the submitted set of rules using the decision_rules package.

    Args:
        request (RuleCoverageRequest)

    Returns:
        dict: A list of dictionaries representing the calculated rule coverage.
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
    X, y = model.split_dataset(df)

    # update model
    for rule in model.rules:
        rule.premise.cached = True
    try:
        if request.type == ProblemTypes.SURVIVAL:
            model.update(X, y)
        else:
            model.calculate_rules_coverages(X, y)
    finally:
        for rule in model.rules:
            rule.premise.invalidate_cache()

    # get up-to-date ruleset coverage
    data = model.coverage_dict

    response_data = sanitize_data(data)
    return response_data
