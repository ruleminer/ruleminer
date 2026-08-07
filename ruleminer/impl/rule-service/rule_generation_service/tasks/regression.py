from typing import Optional

import pandas as pd
from decision_rules.problem import ProblemTypes
from decision_rules.regression.ruleset import RegressionRuleSet
from models.requests import CreateRulesetRequest
from rulekit.events import RuleInductionProgressListener
from task_decorators import RulesetGenerator
from training._deeprules import train_deeprules
from training._rulekit import train_rulekit


@RulesetGenerator(
    task_name="regression",
    algorithm_name="RuleKit"
)
def execute_rulekit_regression_task(
    request: CreateRulesetRequest,
    X: pd.DataFrame,
    y: pd.Series,
    listener: Optional[RuleInductionProgressListener] = None
) -> RegressionRuleSet:
    return train_rulekit(ProblemTypes.REGRESSION, request, X, y, listener)


@RulesetGenerator(
    task_name="regression",
    algorithm_name="DeepRules"
)
def execute_deeprules_regression_task(
    request: CreateRulesetRequest,
    X: pd.DataFrame,
    y: pd.Series,
    listener: Optional[RuleInductionProgressListener] = None  # pylint: disable=unused-argument
) -> RegressionRuleSet:
    return train_deeprules(ProblemTypes.REGRESSION, request, X, y)
