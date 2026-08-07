import logging
from logging.config import dictConfig
from typing import Optional

import pandas as pd
from decision_rules.classification.ruleset import ClassificationRule
from decision_rules.classification.ruleset import ClassificationRuleSet
from decision_rules.core.ruleset import AbstractRule
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.helpers import \
    get_measure_function_by_name as _get_measure_function
from decision_rules.problem import ProblemTypes
from decision_rules.regression.ruleset import RegressionRule
from decision_rules.regression.ruleset import RegressionRuleSet
from decision_rules.serialization.utils import JSONSerializer
from decision_rules.survival.ruleset import SurvivalRule
from decision_rules.survival.ruleset import SurvivalRuleSet
from fastapi.exceptions import HTTPException
from pydantic import ValidationError
from rolap_data_storage.abstract import AbstractDatasetReader
from rolap_data_storage.abstract import FilterConnector
from rolap_data_storage.abstract import FilterList
from rolap_data_storage.abstract import FilterOperators
from rolap_data_storage.implementations.sql.exceptions import \
    DBStorageException
from settings.common import LOGGING
from storage import storage

dictConfig(LOGGING)
logger = logging.getLogger(__name__)


def deserialize_ruleset(ruleset: dict, problem_type: ProblemTypes) -> AbstractRuleSet:
    RULESET_TYPE_MAPPING: dict = {
        ProblemTypes.CLASSIFICATION: ClassificationRuleSet,
        ProblemTypes.REGRESSION: RegressionRuleSet,
        ProblemTypes.SURVIVAL: SurvivalRuleSet,
    }
    try:
        ruleset_class = RULESET_TYPE_MAPPING[problem_type]
        return JSONSerializer.deserialize(ruleset, ruleset_class)
    except ValidationError as e:
        logger.exception(e)
        raise HTTPException(
            status_code=400,
            detail=f"Error parsing ruleset. {str(e)}"
        ) from e


class RulesetFromRuleFactory:

    def __init__(self, problem_type: ProblemTypes) -> None:
        try:
            self.rule_class: type = {
                ProblemTypes.CLASSIFICATION: ClassificationRule,
                ProblemTypes.REGRESSION: RegressionRule,
                ProblemTypes.SURVIVAL: SurvivalRule,
            }[problem_type]
            self.ruleset_class: type = {
                ProblemTypes.CLASSIFICATION: ClassificationRuleSet,
                ProblemTypes.REGRESSION: RegressionRuleSet,
                ProblemTypes.SURVIVAL: SurvivalRuleSet,
            }[problem_type]
        except KeyError as e:
            logger.exception(e)
            raise HTTPException(
                status_code=400,
                detail=f'Unsupported problem type: "{problem_type}"'
            ) from e
        self.problem_type: ProblemTypes = problem_type

    def make(
        self,
        rule: dict,
        column_names: list[str],
        decision_attribute: str,
        survival_time_attribute: Optional[str] = None
    ) -> AbstractRuleSet:
        rule: AbstractRule = self._deserialize_rule(rule)
        ruleset: AbstractRuleSet = self._instantiate_ruleset(
            rule, survival_time_attribute
        )
        ruleset.column_names = column_names
        ruleset.decision_attribute = decision_attribute
        return ruleset

    def _deserialize_rule(self, rule: dict) -> AbstractRule:
        try:
            return JSONSerializer.deserialize(rule, self.rule_class)
        except ValidationError as e:
            logger.exception(e)
            raise HTTPException(
                status_code=400,
                detail=f"Error deserializing rule. {str(e)}"
            ) from e

    def _instantiate_ruleset(
        self,
        rule: dict,
        survival_time_attribute: Optional[str]
    ) -> AbstractRuleSet:
        try:
            constructors_params: dict = self._prepare_ruleset_constructor_params(
                rule, survival_time_attribute
            )
            return self.ruleset_class(**constructors_params)
        except Exception as e:
            logger.exception(e)
            raise HTTPException(
                status_code=400,
                detail=f"Error initializing ruleset from single rule. {str(e)}"
            ) from e

    def _prepare_ruleset_constructor_params(
        self,
        rule: AbstractRule,
        survival_time_attribute: Optional[str]
    ) -> dict:
        constructors_params: dict = {
            'rules': [rule],
        }
        if self.problem_type == ProblemTypes.SURVIVAL:
            if survival_time_attribute is None:
                raise HTTPException(
                    status_code=400,
                    detail='Request missing survival time attribute.'
                )
            constructors_params['survival_time_attr'] = survival_time_attribute
        return constructors_params


def get_ruleset_with_coverage(
        ruleset: dict, problem_type: ProblemTypes, rule_coverage: dict, voting_measure: str = None
) -> AbstractRuleSet:
    model: AbstractRuleSet = deserialize_ruleset(
        ruleset, problem_type)
    if len(model.rules) > 0:
        measure_function = voting_measure
        if measure_function is not None:
            measure_function = get_measure_function_by_name(measure_function)
        model.update_using_coverages(
            rule_coverage, measure=measure_function)
    return model


def get_measure_function_by_name(measure_name: str):
    try:
        return _get_measure_function(measure_name)
    except ValueError as error:
        logger.exception(error)
        raise HTTPException(
            status_code=400,
            detail=f'Measure "{measure_name}" is not supported.'
        ) from error


def read_dataset(dataset_reader: AbstractDatasetReader) -> pd.DataFrame:
    """Reads dataset from the storage and handle possible storage errors

    Args:
        dataset_reader (AbstractDatasetReader): dataset reader

    Returns:
        pd.DataFrame: dataset read from the storage
    """
    try:
        return dataset_reader.read()
    except DBStorageException as e:
        logger.exception(e)
        raise HTTPException(
            status_code=400,
            detail=f'Error reading dataset: {str(e)}'
        ) from e


def read_filtered_dataset(
        dataset_path: str, attributes: list[str], example_indices: list[int] = None
) -> pd.DataFrame:
    if example_indices is not None and len(example_indices) == 0:
        return pd.DataFrame([])
    dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
        path=dataset_path)
    dataset_reader.select_columns(columns=attributes)
    if example_indices is not None:
        # read only specific rows by indices
        dataset_reader.filter(FilterList(
            connector=FilterConnector.AND,
            filters=[{
                'column_name': 'index',
                'operator': FilterOperators.is_in,
                'value': example_indices
            }]
        ))
        df: pd.DataFrame = read_dataset(dataset_reader)
        # storage will read only specific rows but will not preserve their order
        return df.loc[example_indices, :]
    else:
        return read_dataset(dataset_reader)
