from typing import Any
from typing import Optional

import pandas as pd
from decision_rules.classification.ruleset import ClassificationRuleSet
from decision_rules.problem import ProblemTypes
from models.requests import CrossValidationRequest
from rulekit.events import RuleInductionProgressListener
from sklearn.metrics import balanced_accuracy_score
from sklearn.metrics import f1_score
from sklearn.metrics import recall_score
from task_decorators import CrossValidationGenerator
from training._deeprules import train_deeprules
from training._rulekit import train_rulekit


def _calculate_fold_results(
    ruleset: ClassificationRuleSet,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> dict:
    ruleset_stats = ruleset.calculate_ruleset_stats()
    y_pred_train = ruleset.predict(X_train)
    y_pred_test = ruleset.predict(X_test)
    return {
        "Number of rules": ruleset_stats["rules_count"],
        "Number of conditions in a rule": ruleset_stats["avg_conditions_count"],
        "Rule precision": ruleset_stats["avg_precision"],
        "Rule coverage": ruleset_stats["avg_coverage"],
        "Balanced accuracy - train": balanced_accuracy_score(y_train, y_pred_train),
        "Balanced accuracy - test": balanced_accuracy_score(y_test, y_pred_test),
        "F1-score micro train": f1_score(y_train, y_pred_train, average='micro'),
        "F1-score micro test": f1_score(y_test, y_pred_test, average='micro'),
        "Recall micro train": recall_score(y_train, y_pred_train, average='micro'),
        "Recall micro test": recall_score(y_test, y_pred_test, average='micro'),
    }


@CrossValidationGenerator(
    task_name="classification_cross_validation",
    algorithm_name="RuleKit"
)
def execute_rulekit_classification_cross_validation_task(
    cv_request: CrossValidationRequest,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    listener: Optional[RuleInductionProgressListener] = None,
) -> dict:
    ruleset: ClassificationRuleSet = train_rulekit(
        ProblemTypes.CLASSIFICATION, cv_request, X_train, y_train, listener
    )
    return _calculate_fold_results(ruleset, X_train, y_train, X_test, y_test)


@CrossValidationGenerator(
    task_name="classification_cross_validation",
    algorithm_name="DeepRules"
)
def execute_deeprules_classification_cross_validation_task(
    cv_request: CrossValidationRequest,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    listener: Optional[RuleInductionProgressListener] = None,  # pylint: disable=unused-argument
) -> dict:
    ruleset: ClassificationRuleSet = train_deeprules(
        ProblemTypes.CLASSIFICATION, cv_request, X_train, y_train
    )
    return _calculate_fold_results(ruleset, X_train, y_train, X_test, y_test)
