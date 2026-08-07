from decision_rules.core.ruleset import AbstractRuleSet
from rolap_data_storage.abstract.reader import FilterConnector
from rolap_data_storage.abstract.reader import FilterList

from .condition import ConditionToFilterParser


class RuleToFilterParser:
    """
    Class for converting ruleset JSON/dictionary to filtering info for `rolap_data_storage`
    """

    def __init__(self, ruleset: AbstractRuleSet, operator: str = "OR"):
        self.ruleset = ruleset
        self.operator = operator
        self.parsed_rules_ids: list[str] = []
        self.condition_parser = ConditionToFilterParser(
            column_names=ruleset.column_names)

    def parse_ruleset_to_filters(self) -> FilterList:
        rules_list: list[FilterList] = []
        for raw_rule in self.ruleset.rules:
            self.parsed_rules_ids.append(raw_rule.uuid)
            parsed_rule: FilterList = self.condition_parser.parse_condition(
                raw_rule.premise)
            rules_list.append(parsed_rule)
        ruleset_filter_list: FilterList = FilterList(
            connector=FilterConnector[self.operator],
            filters=rules_list
        )
        return ruleset_filter_list
