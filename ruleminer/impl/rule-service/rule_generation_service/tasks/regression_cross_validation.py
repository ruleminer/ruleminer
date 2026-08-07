from typing import Optional

import numpy as np
import pandas as pd
from decision_rules.problem import ProblemTypes
from decision_rules.regression.ruleset import RegressionRuleSet
from models.requests import CrossValidationRequest
from rulekit.events import RuleInductionProgressListener
from sklearn.metrics import max_error
from sklearn.metrics import mean_absolute_error
from sklearn.metrics import mean_absolute_percentage_error
from sklearn.metrics import r2_score
from sklearn.metrics import root_mean_squared_error
from task_decorators import CrossValidationGenerator
from training._deeprules import train_deeprules
from training._rulekit import train_rulekit


def _calculate_fold_results(
    ruleset: RegressionRuleSet,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> dict:
    ruleset_stats = ruleset.calculate_ruleset_stats()
    y_pred_train = ruleset.predict(X_train)
    y_pred_test = ruleset.predict(X_test)
    RMSE_train = root_mean_squared_error(y_train, y_pred_train)
    MAE_train = mean_absolute_error(y_train, y_pred_train)
    MAPE_train = mean_absolute_percentage_error(y_train, y_pred_train)
    rRMSE_train = RMSE_train / np.mean(y_train)
    rMAE_train = MAE_train / np.mean(y_train)
    maxError_train = max_error(y_train, y_pred_train)
    R2_train = r2_score(y_train, y_pred_train)
    RMSE_test = root_mean_squared_error(y_test, y_pred_test)
    MAE_test = mean_absolute_error(y_test, y_pred_test)
    MAPE_test = mean_absolute_percentage_error(y_test, y_pred_test)
    rRMSE_test = RMSE_test / np.mean(y_test)
    rMAE_test = MAE_test / np.mean(y_test)
    maxError_test = max_error(y_test, y_pred_test)
    R2_test = r2_score(y_test, y_pred_test)
    return {
        "Number of rules": ruleset_stats["rules_count"],
        "Number of conditions in a rule": ruleset_stats["avg_conditions_count"],
        "Rule precision": ruleset_stats["avg_precision"],
        "Rule coverage": ruleset_stats["avg_coverage"],
        "RMSE - train": RMSE_train,
        "RMSE - test": RMSE_test,
        "MAE - train": MAE_train,
        "MAE - test": MAE_test,
        "MAPE - train": MAPE_train,
        "MAPE - test": MAPE_test,
        "rRMSE - train": rRMSE_train,
        "rRMSE - test": rRMSE_test,
        "rMAE - train": rMAE_train,
        "rMAE - test": rMAE_test,
        "maxError - train": maxError_train,
        "maxError - test": maxError_test,
        "R^2 - train": R2_train,
        "R^2 - test": R2_test
    }


@CrossValidationGenerator(
    task_name="regression_cross_validation",
    algorithm_name="RuleKit"
)
def execute_rulekit_regression_cross_validation_task(
    cv_request: CrossValidationRequest,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    listener: Optional[RuleInductionProgressListener] = None,
):
    ruleset: RegressionRuleSet = train_rulekit(
        ProblemTypes.REGRESSION, cv_request, X_train, y_train, listener
    )
    return _calculate_fold_results(ruleset, X_train, y_train, X_test, y_test)


@CrossValidationGenerator(
    task_name="regression_cross_validation",
    algorithm_name="DeepRules"
)
def execute_deeprules_regression_cross_validation_task(
    cv_request: CrossValidationRequest,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    listener: Optional[RuleInductionProgressListener] = None,  # pylint: disable=unused-argument
):
    ruleset: RegressionRuleSet = train_deeprules(
        ProblemTypes.REGRESSION, cv_request, X_train, y_train
    )
    return _calculate_fold_results(ruleset, X_train, y_train, X_test, y_test)
