import numpy as np
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.problem import ProblemTypes
from fastapi import APIRouter
from rolap_data_storage.abstract import AbstractDatasetReader
from serializers.request import UniqueExamples
from serializers.request import UniqueExamplesRequest
from storage import storage
from utils.clean import sanitize_data
from utils.read import deserialize_ruleset
from utils.read import read_dataset

router = APIRouter()


@router.post("/calculate_unique_examples")
async def calculate_unique_examples(request: UniqueExamplesRequest) -> list[UniqueExamples]:
    """
    Calculate coverage matrix for the given ruleset and dataset,
    and return list of unique examples for each rule.

    Args:
        request: UniqueExamplesRequest

    Returns:
        dict: A dictionary of unique examples: <rule_id, list[example_id]>.

    """
    # read ruleset
    model: AbstractRuleSet = deserialize_ruleset(
        request.ruleset, request.type)
    rule_keys = [rule.uuid for rule in model.rules]

    # read dataset
    all_attributes: list[str] = [model.decision_attribute] + model.column_names
    dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
        path=request.dataset_path)
    dataset_reader.select_columns(columns=all_attributes)
    df = read_dataset(dataset_reader)
    X, y = model.split_dataset(df)

    # get coverage matrix
    for rule in model.rules:
        rule.premise.cached = True
    try:
        if request.type == ProblemTypes.SURVIVAL:
            coverage_matrix = model.update(X, y)
        else:
            coverage_matrix = model.calculate_rules_coverages(X, y)
    finally:
        for rule in model.rules:
            rule.premise.invalidate_cache()

    # find examples covered by only one rule
    sum_of_rules_for_each_example = coverage_matrix.sum(1)
    unique_mask = sum_of_rules_for_each_example == 1
    # eliminate coverage of examples that are covered by more than one rule
    coverage_matrix[~unique_mask, :] = False

    response_data = []
    # get indices of examples covered by each rule (after the elimination only unique are left)
    for rule, row in zip(model.rules, coverage_matrix.T):
        rule_data = {
            "uuid": rule.uuid,
            "ids": np.argwhere(row).flatten().tolist(),
            "p_unique": row[rule.conclusion.positives_mask(y)].sum(),
        }
        if request.type != ProblemTypes.SURVIVAL:
            rule_data["n_unique"] = row[rule.conclusion.negatives_mask(
                y)].sum()
        response_data.append(rule_data)

    return sanitize_data(response_data)
