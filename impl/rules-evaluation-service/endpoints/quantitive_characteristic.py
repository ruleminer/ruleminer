from typing import Union

import numpy as np
import pandas as pd
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.helpers import correct_p_values_fdr
from decision_rules.helpers import get_significant_fraction
from decision_rules.problem import ProblemTypes
from fastapi import APIRouter
from serializers.request import QuantitativeCharacteristicRequest
from utils.clean import sanitize_data
from utils.read import get_ruleset_with_coverage
from utils.read import read_filtered_dataset

router = APIRouter()

SIGNIFICANCE_LEVEL = 0.05


@router.post("/calculate_characteristic")
async def calculate_characteristic(request: QuantitativeCharacteristicRequest) -> dict[str, Union[int, float]]:
    """Calculates the quantitative characteristic for the submitted set of rules using the decision_rules package.

    Args:
        request (QuantitativeCharacteristicRequest)

    Returns:
        Dict[str, float]: A dictionary containing the calculated characteristic values.
    """
    # read ruleset
    model: AbstractRuleSet = get_ruleset_with_coverage(
        request.ruleset, request.type, request.rule_coverage, request.voting_measure)

    # calculate stats
    data: dict = model.calculate_ruleset_stats()

    decision_attribute: str = model.decision_attribute
    attributes: list[str] = model.column_names
    all_attributes: list[str] = attributes.copy()
    all_attributes.append(decision_attribute)
    dataset: pd.DataFrame = read_filtered_dataset(
        request.dataset_path, all_attributes)
    X_df: pd.DataFrame = dataset[attributes]
    y_df: pd.Series = dataset[decision_attribute]

    if request.type == ProblemTypes.SURVIVAL:
        coverage_matrix: np.ndarray = model.update(X_df, y_df)
    else:
        coverage_matrix: np.ndarray = model.calculate_rules_coverages(
            X_df, y_df)
    fraction_examples_covered: float = coverage_matrix.any(1).mean()
    data['fraction_examples_covered'] = fraction_examples_covered

    # calculate p-values
    if request.type == ProblemTypes.REGRESSION:
        p_values = model.calculate_p_values(y_df)
    else:
        p_values = model.calculate_p_values()
    adjusted_p_values = correct_p_values_fdr(p_values)
    data['fraction_significant'] = get_significant_fraction(
        p_values, SIGNIFICANCE_LEVEL)
    data['fraction_FDR_significant'] = get_significant_fraction(
        adjusted_p_values, SIGNIFICANCE_LEVEL)
    data = sanitize_data(data=data)
    return data
