from decision_rules.classification.ruleset import ClassificationRuleSet
from decision_rules.regression.ruleset import RegressionRuleSet
from decision_rules.survival.ruleset import SurvivalRuleSet
from rolap.api.models.projects import Project


RULESET_TYPE_MAPPING: dict = {
    Project.CLASSIFICATION: ClassificationRuleSet,
    Project.REGRESSION: RegressionRuleSet,
    Project.SURVIVAL: SurvivalRuleSet,
}
