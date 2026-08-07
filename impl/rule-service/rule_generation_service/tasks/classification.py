from typing import Optional

import pandas as pd
from decision_rules.classification.ruleset import ClassificationRuleSet
from decision_rules.problem import ProblemTypes
from models.requests import CreateRulesetRequest
from rulekit.events import RuleInductionProgressListener
from task_decorators import RulesetGenerator
from training._deeprules import train_deeprules
from training._rulekit import train_rulekit


@RulesetGenerator(
    task_name="classification",
    algorithm_name="RuleKit"
)
def execute_rulekit_classification_task(
    request: CreateRulesetRequest,
    X: pd.DataFrame,
    y: pd.Series,
    listener: Optional[RuleInductionProgressListener] = None
) -> ClassificationRuleSet:
    return train_rulekit(ProblemTypes.CLASSIFICATION, request, X, y, listener)


@RulesetGenerator(
    task_name="classification",
    algorithm_name="DeepRules"
)
def execute_deeprules_classification_task(
    request: CreateRulesetRequest,
    X: pd.DataFrame,
    y: pd.Series,
    listener: Optional[RuleInductionProgressListener] = None  # pylint: disable=unused-argument
) -> ClassificationRuleSet:
    return train_deeprules(ProblemTypes.CLASSIFICATION, request, X, y)
