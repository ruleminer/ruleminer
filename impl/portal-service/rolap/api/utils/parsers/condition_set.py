from decision_rules.core.condition import AbstractCondition
from rolap_data_storage.abstract.reader import FilterConnector
from rolap_data_storage.abstract.reader import FilterList
from rolap_data_storage.parsers.condition import ConditionToFilterParser


class ConditionSetToFilterParser:

    def __init__(self, column_names):
        self.condition_parser = ConditionToFilterParser(column_names)

    def parse_condition_set(self, condition_set: list[list[AbstractCondition]]) -> list[FilterList]:
        filters = []
        for condition_list in condition_set:
            filter_list = FilterList(
                connector=FilterConnector.AND,
                filters=[self.condition_parser.parse_condition(condition)
                         for condition in condition_list]
            )
            filters.append(filter_list)
        return filters
