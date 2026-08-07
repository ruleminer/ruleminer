from __future__ import annotations

import deeprules.classification
import deeprules.regression
import deeprules.survival
import pandas as pd
from clean import sanitize_rules_conclusions
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.problem import ProblemTypes
from decision_rules.ruleset_factories import ruleset_factory
from exceptions import EmptyRulesetError
from exceptions import RulesetProcessingError
from models.requests import CreateRulesetRequest
from models.requests import CrossValidationRequest
from ruleset import configure_ruleset_prediction
from training._deeprules.utils import DeepRulesModelTrainer

MODELS_CLASSES = {
    ProblemTypes.CLASSIFICATION: deeprules.classification.Classifier,
    ProblemTypes.REGRESSION: deeprules.regression.Regressor,
    ProblemTypes.SURVIVAL: deeprules.survival.Survival,
}


def train_deeprules(
    problem_type: ProblemTypes,
    request: CreateRulesetRequest | CrossValidationRequest,
    X: pd.DataFrame, y: pd.Series,
) -> AbstractRuleSet:
    model_class = MODELS_CLASSES[problem_type]

    # train the model
    # we copy the parameters dict, as we want to add voting measure to the models kwargs
    parameters = {**request.algorithm_params}
    if problem_type != ProblemTypes.SURVIVAL:
        parameters["voting_measure"] = request.prediction_config.voting_measure

    trainer = DeepRulesModelTrainer(model_class, parameters)
    ruleset: AbstractRuleSet = trainer.fit(X, y)

    if not len(ruleset.rules):
        raise EmptyRulesetError()

    _process_ruleset(problem_type, request, ruleset)

    return ruleset


def _process_ruleset(
    problem_type: ProblemTypes,
    request: CreateRulesetRequest | CrossValidationRequest,
    ruleset: AbstractRuleSet
):
    try:
        configure_ruleset_prediction(ruleset, request.prediction_config)
        if problem_type == ProblemTypes.SURVIVAL:
            sanitize_rules_conclusions(ruleset)
    except Exception as e:
        raise RulesetProcessingError(e) from e
