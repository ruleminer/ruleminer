from typing import Optional

import pandas as pd
from clean import sanitize_rules_conclusions
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.problem import ProblemTypes
from decision_rules.ruleset_factories import ruleset_factory
from exceptions import EmptyRulesetError
from exceptions import RulesetProcessingError
from models.requests import CreateRulesetRequest
from models.requests import CrossValidationRequest
from rulekit.classification import ExpertRuleClassifier
from rulekit.classification import RuleClassifier
from rulekit.events import RuleInductionProgressListener
from rulekit.regression import ExpertRuleRegressor
from rulekit.regression import RuleRegressor
from rulekit.survival import ExpertSurvivalRules
from rulekit.survival import SurvivalRules
from ruleset import configure_ruleset_prediction
from training._rulekit.utils import RuleKitModelTrainer

RULEKIT_MODEL = {
    ProblemTypes.CLASSIFICATION: RuleClassifier,
    ProblemTypes.REGRESSION: RuleRegressor,
    ProblemTypes.SURVIVAL: SurvivalRules,
}

EXPERT_RULEKIT_MODEL = {
    ProblemTypes.CLASSIFICATION: ExpertRuleClassifier,
    ProblemTypes.REGRESSION: ExpertRuleRegressor,
    ProblemTypes.SURVIVAL: ExpertSurvivalRules,
}


def train_rulekit(
        problem_type: ProblemTypes,
        request: CreateRulesetRequest or CrossValidationRequest,
        X: pd.DataFrame, y: pd.Series,
        listener: Optional[RuleInductionProgressListener] = None
) -> AbstractRuleSet:
    # choose model class based on whether training with expert induction or not
    if request.expert_induction is not None:
        model_class = EXPERT_RULEKIT_MODEL[problem_type]
    else:
        model_class = RULEKIT_MODEL[problem_type]

    # train the model
    # we copy the parameters dict, as we want to add voting measure to RuleKit model kwargs
    parameters = {**request.algorithm_params}
    if problem_type != ProblemTypes.SURVIVAL:
        parameters["voting_measure"] = request.prediction_config.voting_measure
    trainer = RuleKitModelTrainer(
        model_class, parameters, request.expert_induction, listener=listener,
    )

    rulekit_model = trainer.fit(X, y)

    if not len(rulekit_model.model.rules):
        raise EmptyRulesetError()

    ruleset = _process_ruleset(problem_type, request, rulekit_model, X, y)

    return ruleset


def _process_ruleset(
        problem_type: ProblemTypes,
        request: CreateRulesetRequest or CrossValidationRequest,
        rulekit_model: RuleClassifier or RuleRegressor or SurvivalRules,
        X: pd.DataFrame, y: pd.Series
):
    try:
        # convert the model into a ruleset instance
        ruleset = ruleset_factory(
            model=rulekit_model,
            X_train=X,
            y_train=y,
        )
        # post-processing
        configure_ruleset_prediction(ruleset, request.prediction_config)
        if problem_type == ProblemTypes.SURVIVAL:
            sanitize_rules_conclusions(ruleset)
    except Exception as e:
        raise RulesetProcessingError(e) from e

    return ruleset
