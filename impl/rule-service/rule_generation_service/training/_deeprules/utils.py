import logging
from logging.config import dictConfig
from typing import Any

import pandas as pd
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.helpers.measures import get_measure_function_by_name
from deeprules._model import BaseModel
from settings.common import LOGGING

dictConfig(LOGGING)
logger = logging.getLogger("rule_generation_service")


class DeepRulesModelTrainer:
    """Utility class for training DeepRules models.

    Args:
        Generic (_type_): Type variable inheriting from deeprules._model.BaseModel
    """

    def __init__(
        self,
        model_type: type,
        parameters: dict[str, Any],
    ):
        if not issubclass(model_type, BaseModel):
            raise ValueError(
                "model_type parameter must be a subclass of "
                "deeprules._model.BaseModel"
            )
        self._model_type: type = model_type
        self._params: dict = self._parse_params(parameters)

    def _parse_params(self, algorithm_params: dict[str, Any]) -> dict[str, Any]:
        # parse measure params from algorithm params
        parsed_init_params = {}
        for key in algorithm_params:
            if "measure" in key:
                parsed_init_params[key] = get_measure_function_by_name(
                    algorithm_params[key]
                )
            else:
                parsed_init_params[key] = algorithm_params[key]
        return parsed_init_params

    def _instantiate_model(self) -> BaseModel:
        try:
            model: BaseModel = self._model_type(**self._params)
        except TypeError as e:
            raise TypeError(
                f"Invalid argument passed to {self._model_type.__class__.__name__}: {e}"
            ) from e
        return model

    def fit(self, X: pd.DataFrame, y: pd.Series) -> AbstractRuleSet:
        """Trains DeepRule model

        Args:
            X (pd.DataFrame):
            y (pd.Series):

        Returns:
            AbstractRuleSet: Trained ruleset
        """
        model: BaseModel = self._instantiate_model()
        return model.fit(X, y)
