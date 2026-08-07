from typing import Any

import numpy as np
from decision_rules.survival.ruleset import SurvivalRuleSet
from numpy import inf
from settings.common import ROUND_DECIMAL_PLACES


class DataSanitizer:
    def __init__(self, decimal_places: int):
        self.decimal_places = decimal_places

    def sanitize_float(self, value: Any, is_ruleset=False) -> Any:
        if isinstance(value, float):
            if np.isnan(value):
                return None
            elif np.isinf(value):
                if value > 0:
                    return "inf"
                else:
                    return "-inf"
            return round(value, self.decimal_places) if not is_ruleset else value
        return value

    def sanitize_data(self, data: Any, is_ruleset=False) -> Any:
        if isinstance(data, dict):
            return {
                key: self.sanitize_data(value, is_ruleset or key == "ruleset")
                for key, value in data.items()
            }
        elif isinstance(data, list):
            return [self.sanitize_data(item, is_ruleset) for item in data]
        elif isinstance(data, np.int64):
            return int(data)
        else:
            return self.sanitize_float(data, is_ruleset)


sanitizer = DataSanitizer(ROUND_DECIMAL_PLACES)


def sanitize_rules_conclusions(ruleset: SurvivalRuleSet):
    for rule in ruleset.rules:
        if rule.conclusion.value == inf:
            rule.conclusion.value = 'inf'

        if rule.conclusion.median_survival_time_ci_lower == inf:
            rule.conclusion.median_survival_time_ci_lower = 'inf'

        if rule.conclusion.median_survival_time_ci_upper == inf:
            rule.conclusion.median_survival_time_ci_upper = 'inf'
