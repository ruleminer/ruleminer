import logging
from logging.config import dictConfig
from typing import Optional

import pandas as pd
from rulekit._operator import BaseOperator
from rulekit.events import RuleInductionProgressListener
from rulekit.exceptions import RuleKitJavaException
from rulekit.params import Measures
from settings.common import LOGGING

dictConfig(LOGGING)
logger = logging.getLogger("rule_generation_service")


class RuleKitModelTrainer:
    """Utility class for training RuleKit models, either with or without
    user defined expert knowledge

    Args:
        Generic (_type_): Type variable inheriting from BaseOperator e.g. RuleClassifier
    """

    def __init__(
        self,
        model_type: type,
        parameters: dict,
        expert_induction_parameters: Optional[dict] = None,
        listener: Optional[RuleInductionProgressListener] = None,
    ):
        if not issubclass(model_type, BaseOperator):
            raise ValueError(
                "model_type parameter must be a subclass of rulekit.operator.BaseOperator"
            )
        if expert_induction_parameters is None:
            expert_induction_parameters = {}
        self._rulekit_model_type: type = model_type
        self._params: dict = self._parse_params(parameters)
        self._expert_init_params, self._expert_fit_params = self._parse_expert_params(
            expert_induction_parameters
        )
        self._listener = listener

    def _parse_params(self, algorithm_params: dict) -> dict:
        # parse measure params from algorithm params
        parsed_init_params = {}
        for key in algorithm_params:
            if "measure" in key:
                parsed_init_params[key] = Measures[algorithm_params[key]]
            else:
                parsed_init_params[key] = algorithm_params[key]
        return parsed_init_params

    def _parse_expert_params(self, expert_params: dict) -> tuple[dict, dict]:
        # separate expert params into those which go into class constructor and those which go into fit method
        expert_init_params = {}
        expert_fit_params = {}
        expert_fit_params_names = set(getattr(
            self._rulekit_model_type.fit,  # pylint: disable=no-member
            "__annotations__",
            {}
        ))
        for key in expert_params:
            if key in expert_fit_params_names:
                expert_fit_params[key] = expert_params[key]
            else:
                expert_init_params[key] = expert_params[key]
        return expert_init_params, expert_fit_params

    def _instantiate_model(self) -> BaseOperator:
        try:
            model = self._rulekit_model_type(**{
                **self._params, **self._expert_init_params
            })
        except TypeError as e:
            raise TypeError(
                f"Invalid argument passed to {self._rulekit_model_type.__class__.__name__}: {e}"
            ) from e
        if self._listener is not None:
            model.add_event_listener(self._listener)
        return model

    def fit(self, X: pd.DataFrame, y: pd.Series) -> BaseOperator:
        """Trains RuleKit model

        Args:
            X (pd.DataFrame):
            y (pd.Series):

        Returns:
            BaseOperator: Trained ruleset
        """
        ruleset: BaseOperator = self._instantiate_model()
        try:
            ruleset.fit(  # pylint: disable=no-member
                X, y, **self._expert_fit_params
            )
        except RuleKitJavaException as e:
            # java stack trace must be logged explicitly - it is different from the python one
            logger.exception(e.print_java_stack_trace())
            raise e
        except TypeError as e:
            raise TypeError(
                f"Invalid argument passed to {self._rulekit_model_type.__class__.__name__}.fit: {e}"
            ) from e
        return ruleset
