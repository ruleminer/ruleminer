from typing import Optional

import pandas as pd
from decision_rules.problem import ProblemTypes
from decision_rules.survival.ruleset import SurvivalRuleSet
from models.requests import CrossValidationRequest
from rulekit.events import RuleInductionProgressListener
from task_decorators import CrossValidationGenerator
from training._deeprules import train_deeprules
from training._rulekit import train_rulekit


def _calculate_fold_results(
    ruleset: SurvivalRuleSet,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> dict:
    ruleset_stats = ruleset.calculate_ruleset_stats()
    return {
        "Number of rules": ruleset_stats["rules_count"],
        "Number of conditions in a rule": ruleset_stats["avg_conditions_count"],
        "Rule precision": ruleset_stats["avg_precision"],
        "Rule coverage": ruleset_stats["avg_coverage"],
        "IBS - train": ruleset.integrated_bier_score(X_train, y_train),
        "IBS - test": ruleset.integrated_bier_score(X_test, y_test),
    }


@CrossValidationGenerator(
    task_name="survival_cross_validation",
    algorithm_name="RuleKit"
)
def execute_rulekit_survival_cross_validation_task(
    cv_request: CrossValidationRequest,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    listener: Optional[RuleInductionProgressListener] = None,
):
    ruleset: SurvivalRuleSet = train_rulekit(
        ProblemTypes.SURVIVAL, cv_request, X_train, y_train, listener
    )
    return _calculate_fold_results(ruleset, X_train, y_train, X_test, y_test)


@CrossValidationGenerator(
    task_name="survival_cross_validation",
    algorithm_name="DeepRules"
)
def execute_deeprules_survival_cross_validation_task(
    cv_request: CrossValidationRequest,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    listener: Optional[RuleInductionProgressListener] = None,  # pylint: disable=unused-argument
):
    ruleset: SurvivalRuleSet = train_deeprules(
        ProblemTypes.SURVIVAL, cv_request, X_train, y_train
    )
    return _calculate_fold_results(ruleset, X_train, y_train, X_test, y_test)
