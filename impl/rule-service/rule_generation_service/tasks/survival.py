from typing import Optional

import pandas as pd
from decision_rules.problem import ProblemTypes
from decision_rules.survival.ruleset import SurvivalRuleSet
from models.requests import CreateRulesetRequest
from rulekit.events import RuleInductionProgressListener
from task_decorators import RulesetGenerator
from training._deeprules import train_deeprules
from training._rulekit import train_rulekit


@RulesetGenerator(
    task_name="survival",
    algorithm_name="RuleKit"
)
def execute_rulekit_survival_analysis_task(
    request: CreateRulesetRequest,
    X: pd.DataFrame,
    y: pd.Series,
    listener: Optional[RuleInductionProgressListener] = None
) -> SurvivalRuleSet:
    return train_rulekit(ProblemTypes.SURVIVAL, request, X, y, listener)


@RulesetGenerator(
    task_name="survival",
    algorithm_name="DeepRules"
)
def execute_deeprules_survival_analysis_task(
    request: CreateRulesetRequest,
    X: pd.DataFrame,
    y: pd.Series,
    listener: Optional[RuleInductionProgressListener] = None  # pylint: disable=unused-argument
) -> SurvivalRuleSet:
    return train_deeprules(ProblemTypes.SURVIVAL, request, X, y)
