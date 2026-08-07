from dataset_reader import read_columns
from decision_rules.classification.ruleset import ClassificationRuleSet
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.problem import ProblemTypes
from decision_rules.regression.ruleset import RegressionRuleSet
from decision_rules.serialization import JSONSerializer
from decision_rules.survival.ruleset import SurvivalRuleSet
from exceptions import PredictionConfigurationError
from models.common import Attribute
from models.common import PredictionConfig

RULESET_TYPE_MAPPING: dict = {
    ProblemTypes.CLASSIFICATION: ClassificationRuleSet,
    ProblemTypes.REGRESSION: RegressionRuleSet,
    ProblemTypes.SURVIVAL: SurvivalRuleSet,
}


def deserialize_ruleset(ruleset: dict, problem_type: ProblemTypes) -> AbstractRuleSet:
    ruleset_class = RULESET_TYPE_MAPPING[problem_type]
    return JSONSerializer.deserialize(ruleset, ruleset_class)


def configure_ruleset_prediction(ruleset: AbstractRuleSet, prediction_config: PredictionConfig):
    try:
        ruleset.set_prediction_strategy(prediction_config.prediction_strategy)
    except Exception as e:
        raise PredictionConfigurationError(e)

    ruleset.set_default_conclusion_enabled(prediction_config.use_default_rule)


def update_ruleset_meta(ruleset: AbstractRuleSet, attributes: list[Attribute], storage_path: str):
    all_columns = read_columns(storage_path)
    target_columns = {
        attr.name for attr in attributes if attr.role == 'class'}
    all_attributes = [
        col for col in all_columns if col not in target_columns]
    ruleset.update_meta(all_attributes)
