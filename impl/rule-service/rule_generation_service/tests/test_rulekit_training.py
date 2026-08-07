import unittest

from decision_rules.classification.ruleset import ClassificationRuleSet
from decision_rules.problem import ProblemTypes
from decision_rules.regression.ruleset import RegressionRuleSet
from decision_rules.survival.ruleset import SurvivalRuleSet
from models.requests import CreateRulesetRequest
from tasks import classification_cross_validation as clf_cv
from tasks import regression_cross_validation as reg_cv
from tasks import survival_cross_validation as surv_cv
from tests.loader import load_dataset
from training._rulekit.common import train_rulekit


class RuleKitTrainingTestCase(unittest.TestCase):
    def _get_mock_request(self, x_df):
        attributes = [
            {"name": col, "role": "attr"} for col in x_df.columns
        ]
        request = CreateRulesetRequest(
            name="test",
            description="test",
            generation_method="test",
            algorithm_params={},
            expert_induction=None,
            attributes=attributes,
            cross_validation=False,
            num_folds=None,
            prediction_config={
                "prediction_strategy": "vote", "use_default_rule": True},
            algorithm_id=42,
            dataset_id=42,
            dataset_storage_path="test",
        )
        return request

    def test_classification(self):
        data = load_dataset("predictive_maintenance").iloc[:200]
        params = {
            "induction_measure": "Precision",
            "pruning_measure": "Precision",
            "minsupp_new": 1.0
        }
        x_df = data.drop("Failure Type", axis=1)
        y_df = data["Failure Type"]
        request = self._get_mock_request(x_df)
        request.algorithm_params = params
        request.prediction_config.voting_measure = "Precision"
        ruleset = train_rulekit(
            ProblemTypes.CLASSIFICATION, request, x_df, y_df)
        self.assertIsInstance(ruleset, ClassificationRuleSet)
        self.assertNotEqual(ruleset.rules, [])

        results = clf_cv._calculate_fold_results(
            ruleset, x_df, y_df, x_df, y_df)
        self.assertIsInstance(results, dict)
        self.assertTrue(len(results))

    def test_regression(self):
        data = load_dataset("diabetes").iloc[:50]
        params = {
            "induction_measure": "Precision",
            "pruning_measure": "Precision",
            "minsupp_new": 1.0
        }
        x_df = data.drop("label", axis=1)
        y_df = data["label"]
        request = self._get_mock_request(x_df)
        request.algorithm_params = params
        request.prediction_config.voting_measure = "Precision"
        ruleset = train_rulekit(ProblemTypes.REGRESSION, request, x_df, y_df)
        self.assertIsInstance(ruleset, RegressionRuleSet)
        self.assertNotEqual(ruleset.rules, [])

        results = reg_cv._calculate_fold_results(
            ruleset, x_df, y_df, x_df, y_df)
        self.assertIsInstance(results, dict)
        self.assertTrue(len(results))

    def test_survival(self):
        data = load_dataset("zinc")
        params = {
            "max_growing": 0,
            "minsupp_new": 10,
            "max_rule_count": 0,
            "select_best_candidate": True,
            "max_uncovered_fraction": 0.02,
            "complementary_conditions": False,
            "survival_time_attr": "survival_time",
        }
        x_df = data.drop("survival_status", axis=1)
        y_df = data["survival_status"].astype(int).astype(str)
        request = self._get_mock_request(x_df)
        request.algorithm_params = params
        ruleset = train_rulekit(ProblemTypes.SURVIVAL, request, x_df, y_df)
        self.assertIsInstance(ruleset, SurvivalRuleSet)
        self.assertNotEqual(ruleset.rules, [])

        results = surv_cv._calculate_fold_results(
            ruleset, x_df, y_df, x_df, y_df)
        self.assertIsInstance(results, dict)
        self.assertTrue(len(results))
