from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.histogram import get_histograms
from decision_rules.histogram import Histograms
from decision_rules.measures import *
from fastapi import APIRouter
from fastapi.exceptions import HTTPException
from rolap_data_storage.abstract import AbstractDatasetReader
from serializers.request import HistogramRequest
from storage import storage
from utils.read import deserialize_ruleset
from utils.read import read_dataset

router = APIRouter()


@router.post("/calculate_covered_examples_label_histogram")
async def histogram(request: HistogramRequest) -> Histograms:
    """
    Calculates histograms of the label column values for covered examples by rules in the ruleset.

    Parameters:
    - request (HistogramRequest)

    Returns:
        Histograms: The histograms of the label column values for covered examples by rules in the ruleset.
    """
    # deserialize ruleset
    model: AbstractRuleSet = deserialize_ruleset(
        request.ruleset, request.type)
    # get attribute data from request
    decision_attribute: str = model.decision_attribute
    attributes: list[str] = model.column_names
    all_attributes: list[str] = attributes.copy()
    all_attributes.append(decision_attribute)
    # read dataset
    dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
        path=request.dataset_path)
    dataset_reader.select_columns(columns=all_attributes)
    df = read_dataset(dataset_reader)
    # calculate histogram
    try:
        response: Histograms = get_histograms(
            model=model, dataset=df, problem_type=request.type, bins=request.bins, for_rules=request.for_rules)
    except NotImplementedError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return response
