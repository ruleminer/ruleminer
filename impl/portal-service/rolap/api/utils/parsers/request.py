import re
from dataclasses import dataclass
from dataclasses import fields

from decision_rules.classification.ruleset import ClassificationRuleSet
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.regression.ruleset import RegressionRuleSet
from decision_rules.serialization._core import _ConditionSerializer
from decision_rules.serialization.utils import JSONSerializer
from decision_rules.survival.ruleset import SurvivalRuleSet
from pydantic import ValidationError
from rest_framework.request import Request
from rest_framework.serializers import Serializer
from rolap.api.exceptions import InvalidRequestException
from rolap.api.exceptions import MissingParameterException
from rolap.api.models.datasets import DatasetReadParams
from rolap.api.serializers.datasets import DatasetPreviewRequestSerializer
from rolap.api.serializers.datasets import ModifyDatasetRequestSerializer
from rolap.api.serializers.rulesets.rulesets import ConditionSetSerializer
from rolap.api.serializers.rulesets.rulesets import RulesetFilterJSONSerializer
from rolap.api.serializers.rulesets.rulesets import RulesetModifyJSONSerializer
from rolap.api.utils.helper import parse_boolean
from rolap_data_storage.abstract.reader import FilterConnector
from rolap_data_storage.abstract.reader import FilterInfo
from rolap_data_storage.abstract.reader import FilterList
from rolap_data_storage.abstract.reader import FilterOperators
from rolap_data_storage.parsers.condition import ConditionParsingError
from rolap_data_storage.parsers.ruleset import RuleToFilterParser

from .condition_set import ConditionSetToFilterParser


class RequestParametersParser:
    """
    Base class for parsing data from query params and request body
    which are required for dataset reading and filtering
    """
    parameters_class = None
    request_serializer_class = None
    use_limit_and_offset = True

    FILTER_OPERATOR_MAPPING = {
        "eq": FilterOperators.equal,
        "ne": FilterOperators.not_equal,
        "gt": FilterOperators.greater,
        "ge": FilterOperators.greater_equal,
        "lt": FilterOperators.lower,
        "le": FilterOperators.lower_equal,
        "icontains": FilterOperators.icontains,
        "istartswith": FilterOperators.istartswith,
    }

    def parse_request_params(self, request: Request, *args, **kwargs) -> DatasetReadParams:
        request_data_serialized = self._serialize_request_data(request)

        query_params = self._parse_simple_query_params(request.query_params)
        filters = self._parse_filter_query_params(request.query_params)

        request_data_params = self._parse_request_data_to_params(
            request_data_serialized)
        sort = request_data_params.pop('sort', [])

        return self.parameters_class(
            **query_params,
            filters=filters,
            sort=sort,
            **request_data_params,
        )

    def _parse_simple_query_params(self, query_params: dict) -> dict:
        parsed_query_params = {}

        if self.use_limit_and_offset:
            if 'limit' not in query_params:
                raise MissingParameterException(missing_label="limit")

            if 'offset' not in query_params:
                raise MissingParameterException(missing_label='offset')

            limit: int = int(query_params['limit'])
            parsed_query_params["limit"] = limit
            offset: int = int(query_params['offset'])
            parsed_query_params["offset"] = offset
        else:
            parsed_query_params["limit"] = None
            parsed_query_params["offset"] = 0

        return parsed_query_params

    def _parse_filter_query_params(self, query_params: dict) -> FilterList:
        filter_regex = r"(?P<column>.*)__(?P<operator>[a-z]{2,12})$"
        filter_keys = [
            key for key in query_params if re.match(filter_regex, key)]
        filters = []
        for key in filter_keys:
            match = re.match(filter_regex, key).groupdict()
            column = match["column"]
            operator = match["operator"]
            if operator not in self.FILTER_OPERATOR_MAPPING:
                raise InvalidRequestException(
                    f"Invalid comparison operator passed for `{column}`")
            value = query_params[key]
            filter_info = FilterInfo(
                column_name=column,
                operator=self.FILTER_OPERATOR_MAPPING[operator],
                value=value,
            )
            filters.append(filter_info)
        filter_list = FilterList(
            connector=FilterConnector.AND,
            filters=filters
        )
        return filter_list

    def _parse_request_data_to_params(self, serializer: Serializer) -> dict:
        missing_fields = [
            field.name for field in fields(self.parameters_class)]
        request_params = {
            field: serializer.data[field] for field in missing_fields if field in serializer.data
        }
        return request_params

    def _serialize_request_data(self, request: Request) -> Serializer:
        request_data_serialized = self.request_serializer_class(
            data=request.data)
        request_data_serialized.is_valid(raise_exception=True)
        return request_data_serialized


class PreviewRequestParser(RequestParametersParser):
    parameters_class = DatasetReadParams
    request_serializer_class = DatasetPreviewRequestSerializer


class ModifyRequestParser(RequestParametersParser):
    @dataclass
    class Params(DatasetReadParams):
        name: str = None

    parameters_class = Params
    request_serializer_class = ModifyDatasetRequestSerializer
    use_limit_and_offset = False


class RulesetFilterRequestParser(RequestParametersParser):
    parameters_class = DatasetReadParams
    request_serializer_class = RulesetFilterJSONSerializer
    RULESET_TYPE_MAPPING: dict = {
        "classification": ClassificationRuleSet,
        "regression": RegressionRuleSet,
        "survival": SurvivalRuleSet,
    }

    def parse_request_params(self, request: Request, *args, **kwargs) -> DatasetReadParams:
        request_data_serialized = self._serialize_request_data(request)

        # if only uniquely covered examples are requested, simply filter by their IDs and ignore the rest
        unique: list = request_data_serialized["unique"].value
        filters: FilterList
        operator = request.query_params.get('operator', 'OR').upper()
        if operator not in ['AND', 'OR']:
            raise InvalidRequestException(
                f"Invalid operator '{operator}'. Allowed values are 'AND' or 'OR'.")
        if unique:
            filters = self._create_unique_filters(unique, operator)
        else:
            filters, _ = self._parse_filters_from_ruleset(
                request_data_serialized, kwargs["problem_type"], operator)

        query_params: dict = self._parse_simple_query_params(
            request.query_params)

        request_data_params = self._parse_request_data_to_params(
            request_data_serialized)

        return self.parameters_class(
            **query_params,
            filters=filters,
            columns=[],
            **request_data_params
        )

    def _parse_filters_from_ruleset(self, data: Serializer, problem_type: str, operator: str = 'OR') -> tuple[FilterList, list[str]]:
        ruleset_class = self.RULESET_TYPE_MAPPING[problem_type]

        ruleset: dict = data["ruleset"].value
        try:
            deserialized_ruleset: AbstractRuleSet = JSONSerializer.deserialize(
                ruleset, ruleset_class)
        except KeyError as e:
            raise InvalidRequestException(
                f"Invalid value found in ruleset: {str(e)}")
        except ValidationError as e:
            errors = []
            for error in e.errors():
                msg = f"Could not parse the value for field `{error['loc'][0]}`"  # nopep8
                errors.append(msg)
            errors = "; ".join(errors)
            raise InvalidRequestException(errors)

        try:
            ruleset_parser: RuleToFilterParser = RuleToFilterParser(
                deserialized_ruleset, operator)
            filters: FilterList = ruleset_parser.parse_ruleset_to_filters()
        except ConditionParsingError as e:
            msg = "Error during ruleset parsing: " + str(e)
            raise InvalidRequestException(msg)

        return filters, ruleset_parser.parsed_rules_ids

    def _create_unique_filters(self, unique: list, operator: FilterOperators) -> FilterList:
        filters = FilterList(
            connector=FilterConnector[operator],
            filters=[],
        )
        for rule in unique:
            if "ids" not in rule:
                raise MissingParameterException("ids")
            id_filter = FilterInfo(
                column_name="index",
                operator=FilterOperators.is_in,
                value=rule["ids"],
            )
            filters.filters.append(id_filter)
        return filters


class RulesetModifyRequestParser(RulesetFilterRequestParser):
    parameters_class = ModifyRequestParser.Params
    request_serializer_class = RulesetModifyJSONSerializer
    use_limit_and_offset = False


class RulesetCoveredIndicesParser(RulesetFilterRequestParser):
    @dataclass
    class Params(DatasetReadParams):
        rule_id: str = None

    parameters_class = Params

    def parse_request_params(self, request: Request, *args, **kwargs) -> list[DatasetReadParams]:
        request_data_serialized = self._serialize_request_data(request)

        filters: FilterList
        rule_ids: list[str]
        filters, rule_ids = self._parse_filters_from_ruleset(
            request_data_serialized, kwargs["problem_type"])

        params_list = [
            self.parameters_class(
                limit=request.GET.get('limit'),
                offset=request.GET.get('offset'),
                columns=["index", ],
                filters=filter_set,
                sort=[],
                rule_id=rule_id,
            )
            for filter_set, rule_id in zip(filters.filters, rule_ids)
        ]

        return params_list


class ConditionSetRequestParser(RequestParametersParser):
    parameters_class = DatasetReadParams
    request_serializer_class = ConditionSetSerializer

    def parse_request_params(self, request: Request, *args, **kwargs) -> list[DatasetReadParams]:
        # serialize request data
        serialized_data = self._serialize_request_data(request)
        # deserialize conditions
        conditions = [
            [_ConditionSerializer.deserialize(
                condition) for condition in condition_list]
            for condition_list in serialized_data.validated_data["conditions"]
        ]
        # parse conditions
        condition_parser = ConditionSetToFilterParser(
            serialized_data.validated_data["meta"]["attributes"])
        try:
            filters_list = condition_parser.parse_condition_set(conditions)
        except ConditionParsingError as e:
            msg = "Error during parsing of conditions: " + str(e)
            raise InvalidRequestException(msg)
        # prepare dataset read parameters
        params_list = [
            self.parameters_class(
                limit=None,
                offset=None,
                sort=[],
                columns=[],
                filters=filters,
            )
            for filters in filters_list
        ]
        return params_list
