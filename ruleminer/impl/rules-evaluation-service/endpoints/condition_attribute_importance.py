from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.measures import *
from fastapi import APIRouter
from rolap_data_storage.abstract import AbstractDatasetReader
from serializers.request import ConditionImportanceRequest
from serializers.response import ImportanceResponse
from storage import storage
from utils.clean import sanitize_data
from utils.read import deserialize_ruleset
from utils.read import get_measure_function_by_name
from utils.read import read_dataset

router = APIRouter()


@router.post("/calculate_importance")
async def calculate_importance(request: ConditionImportanceRequest) -> ImportanceResponse:
    """Calculates condition and attribute importance for the submitted set of rules using the decision_rules package.

    Args:
        request (ConditionImportanceRequest)

    Returns:
        List[dict]: A list of dictionaries representing the calculated importance.
    """
    # parse request
    model: AbstractRuleSet = deserialize_ruleset(
        request.ruleset, request.type)
    decision_attribute: str = model.decision_attribute
    attributes: list[str] = model.column_names
    all_attributes: list[str] = attributes.copy()
    all_attributes.append(decision_attribute)

    # get dataset
    dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
        path=request.dataset_path)
    dataset_reader.select_columns(columns=all_attributes)
    df = read_dataset(dataset_reader)

    # calculate data
    if request.voting_measure is not None:
        measure_function = get_measure_function_by_name(request.voting_measure)
    else:
        measure_function = None
    model.update_using_coverages(
        request.rule_coverage, measure=measure_function)
    X, y = model.split_dataset(df)
    condition_importance = model.calculate_condition_importances(
        X, y, measure_function)
    attribute_importance = model.calculate_attribute_importances(
        condition_importance)

    # sanitize data
    condition_importance = sanitize_data(condition_importance)
    attribute_importance = sanitize_data(attribute_importance)

    # prepare and return response
    response = ImportanceResponse(
        condition_importance=transform_condition_importances(
            condition_importance),
        attribute_importance=attribute_importance
    )
    return response


def transform_condition_importances(condition_importances):
    transformed = {}
    if isinstance(condition_importances, dict):
        for class_name, conditions_list in condition_importances.items():
            class_conditions_dict = {}
            for condition in conditions_list:
                condition_string = condition['condition']
                importance = condition['importance']
                class_conditions_dict[condition_string] = importance
            transformed[class_name] = class_conditions_dict
    else:
        for condition in condition_importances:
            condition_string = condition['condition']
            importance = condition['importance']
            transformed[condition_string] = importance

    return transformed
