import numpy as np
import pandas as pd
from decision_rules.similarity import calculate_rule_similarity
from exceptions.exceptions import NotSupportedForRulesWithAlternativesException
from fastapi import APIRouter
from fastapi import HTTPException
from rolap_data_storage.abstract import AbstractDatasetReader
from serializers.request import RuleSimilarityRequest
from storage import storage
from utils.clean import sanitize_float
from utils.read import deserialize_ruleset
from utils.read import read_dataset

router = APIRouter()


@router.post("/calculate_rule_similarity")
async def calculate_ruleset_similarity(request: RuleSimilarityRequest) -> dict:
    """Calculate the rule similarity between two sets of rules based on the specified measure.

    Args:
        request (RuleSimilarityRequest)

    Returns:
        JSONResponse: FastAPI JSON response containing the calculated rule similarity.
    """
    # read dataset
    dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
        path=request.dataset_path)
    df = read_dataset(dataset_reader)
    # get rulesets
    ruleset1 = deserialize_ruleset(
        request.ruleset1, request.type)
    ruleset2 = deserialize_ruleset(
        request.ruleset2, request.type)

    # check if there is a match between rulesets and the dataset
    if set(ruleset1.column_names) - set(df.columns) or set(ruleset2.column_names) - set(df.columns):
        raise HTTPException(
            status_code=400, detail="Ruleset attributes do not match the dataset attributes")

    # calculate similarity
    try:
        similarity_matrix: np.ndarray = calculate_rule_similarity(
            ruleset1, ruleset2, df, request.similarity_type, request.measure)
    except ValueError as e:
        raise HTTPException(
            status_code=400, detail=str(e)) from e
    except NotImplementedError as e:
        # this excepts handle the case then similarity is calculated for rules
        # containing alternatives which is not supported yet
        raise NotSupportedForRulesWithAlternativesException() from e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)) from e

    ruleset1_uuids = [rule.uuid for rule in ruleset1.rules]
    ruleset2_uuids = [rule.uuid for rule in ruleset2.rules]
    similarity_matrix = pd.DataFrame(
        similarity_matrix, index=ruleset1_uuids, columns=ruleset2_uuids
    )
    similarity_matrix = similarity_matrix.map(sanitize_float)

    return similarity_matrix.to_dict(orient="index")
