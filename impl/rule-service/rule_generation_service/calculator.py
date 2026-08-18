from time import perf_counter
from typing import Optional

import pandas as pd
from dataset_reader import read_with_ruleset
from decision_rules.classification.prediction_indicators import \
    calculate_for_classification
from decision_rules.classification.ruleset import ClassificationRuleSet
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.helpers import correct_p_values_fdr
from decision_rules.helpers import get_measure_function_by_name
from decision_rules.helpers import get_significant_fraction
from decision_rules.histogram import get_histograms
from decision_rules.problem import ProblemTypes
from decision_rules.regression.prediction_indicators import \
    calculate_for_regression
from decision_rules.regression.ruleset import RegressionRuleSet
from decision_rules.survival.prediction_indicators import \
    calculate_for_survival
from decision_rules.survival.ruleset import SurvivalRuleSet
from models.results import RulesetStatistics

SIGNIFICANCE_LEVEL = 0.05

PROBLEM_TYPE_MAPPING: dict = {
    ClassificationRuleSet: ProblemTypes.CLASSIFICATION,
    RegressionRuleSet: ProblemTypes.REGRESSION,
    SurvivalRuleSet: ProblemTypes.SURVIVAL,
}


class RulesetStatisticCalculator:
    def __init__(
            self,
            ruleset: AbstractRuleSet,
            voting_measure: Optional[str],
            dataset_path: str,
    ):
        self.ruleset: AbstractRuleSet = ruleset
        self.problem_type: ProblemTypes = PROBLEM_TYPE_MAPPING[type(ruleset)]
        self.X_df, self.y_df = read_with_ruleset(dataset_path, ruleset)
        self.dataset = pd.concat([self.X_df, self.y_df], axis=1)
        self.voting_measure = voting_measure
        self.dataset_path: str = dataset_path
        self.fraction_examples_covered: float = None

    def calculate(self) -> RulesetStatistics:
        start = perf_counter()

        # coverage
        coverage = self._calculate_coverage()
        measure_function = self.voting_measure
        if measure_function is not None:
            measure_function = get_measure_function_by_name(measure_function)
        self.ruleset.update_using_coverages(coverage, measure=measure_function)

        # characteristics
        characteristics = self._calculate_characteristics()

        # rule indicators
        supported_metrics = self.ruleset.get_metrics_object_instance().supported_metrics
        # do not calculate `p_unique` and `n_unique` metrics
        metrics_to_calculate = list(
            filter(lambda x: x not in ["p_unique",
                                       "n_unique", "all_unique", "unique_in_pos", "unique_in_neg", "unique"], supported_metrics)
        )
        rule_indicators = self.ruleset.calculate_rules_metrics(
            self.X_df, self.y_df, metrics_to_calculate)

        # prediction indicators
        prediction_indicators = self._calculate_prediction_indicators()

        # histograms
        if self.problem_type == ProblemTypes.REGRESSION:
            rule_histograms = get_histograms(
                self.ruleset, self.dataset, self.problem_type, 20)
        else:
            rule_histograms = None

        # importance results
        condition_importance = self.ruleset.calculate_condition_importances(
            self.X_df, self.y_df, measure_function)
        attribute_importance = self.ruleset.calculate_attribute_importances(
            condition_importance)

        condition_importance = self._transform_condition_importances(
            condition_importance)

        stop = perf_counter()
        calculation_time = stop - start

        result = RulesetStatistics(
            rule_coverage=coverage,
            characteristics=characteristics,
            rule_indicators=rule_indicators,
            condition_importance=condition_importance,
            attribute_importance=attribute_importance,
            prediction_indicators=prediction_indicators,
            rule_histograms=rule_histograms,
            calculation_time=calculation_time,
        )
        return result

    def _calculate_coverage(self) -> dict:
        if self.problem_type == ProblemTypes.SURVIVAL:
            coverage_matrix = self.ruleset.update(self.X_df, self.y_df)
        else:
            coverage_matrix = self.ruleset.calculate_rules_coverages(
                self.X_df, self.y_df)

        self.fraction_examples_covered = coverage_matrix.any(1).mean()

        return self.ruleset.coverage_dict

    def _calculate_characteristics(self) -> dict:
        data: dict = self.ruleset.calculate_ruleset_stats()
        # calculate p-values
        if self.problem_type == ProblemTypes.REGRESSION:
            p_values = self.ruleset.calculate_p_values(self.y_df)
        else:
            p_values = self.ruleset.calculate_p_values()
        adjusted_p_values = correct_p_values_fdr(p_values)
        data['fraction_significant'] = get_significant_fraction(
            p_values, SIGNIFICANCE_LEVEL)
        data['fraction_FDR_significant'] = get_significant_fraction(
            adjusted_p_values, SIGNIFICANCE_LEVEL)

        data['fraction_examples_covered'] = self.fraction_examples_covered

        return data

    def _calculate_prediction_indicators(self) -> dict:
        y_pred = self.ruleset.predict(self.X_df)
        y_true = self.y_df
        if self.problem_type == ProblemTypes.CLASSIFICATION:
            data: dict = calculate_for_classification(
                y_true, y_pred,
                calculate_only_for_covered_examples=True
            )
        elif self.problem_type == ProblemTypes.REGRESSION:
            data: dict = calculate_for_regression(
                y_true, y_pred,
                calculate_only_for_covered_examples=True
            )
        elif self.problem_type == ProblemTypes.SURVIVAL:
            data: dict = calculate_for_survival(
                self.ruleset, self.X_df, y_true, y_pred,
                calculate_only_for_covered_examples=True
            )
        else:
            raise ValueError(f'Invalid problem type: "{self.problem_type}"')
        return data

    def _transform_condition_importances(self, condition_importances):
        transformed = {}
        if isinstance(condition_importances, dict):
            for class_name, conditions_list in condition_importances.items():
                class_conditions_dict = {}
                for condition in conditions_list:
                    condition_string = condition['condition']
                    importance = condition['importance']
                    class_conditions_dict[condition_string] = importance
                transformed[class_name] = class_conditions_dict
        else:
            for condition in condition_importances:
                condition_string = condition['condition']
                importance = condition['importance']
                transformed[condition_string] = importance

        return transformed
