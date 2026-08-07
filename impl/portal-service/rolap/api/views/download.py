import io
from io import BytesIO
from typing import Optional

import pandas as pd
from decision_rules.classification.ruleset import ClassificationRuleSet
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.regression.ruleset import RegressionRuleSet
from decision_rules.serialization.utils import JSONSerializer
from decision_rules.survival.ruleset import SurvivalRuleSet
from django.conf import settings
from django.http import FileResponse
from rest_framework.exceptions import NotFound
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import UnsupportedDownloadFileTypeException
from rolap.api.models import Dataset
from rolap.api.models import ImportanceResults
from rolap.api.models import Ruleset
from rolap.api.models.datasets import DatasetReadParams
from rolap.api.serializers.rulesets.rulesets import RulesetModifyJSONSerializer
from rolap.api.utils.constants import RULESET_TYPE_MAPPING
from rolap.api.utils.parsers import ModifyRequestParser
from rolap.api.utils.parsers import RulesetModifyRequestParser
from rolap.api.views.base import DatasetBaseView
from rolap.api.views.base import RulesetBaseView
from rolap_data_storage.abstract.reader import FilterList
from rolap_data_storage.parsers.ruleset import RuleToFilterParser


class DownloadViewsMixin:
    serializer_class = None

    def prepare_file(self, df: pd.DataFrame, format_type="csv", index=True) -> io.BytesIO:
        if format_type == 'xlsx':
            file = BytesIO()
            with pd.ExcelWriter(file, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Importance')
            file.seek(0)
            return file
        else:
            # convert dataframe to downloadable csv file
            file = io.BytesIO()
            df.to_csv(file, index=index)
            file.seek(0)
            return file

    def deserialize_ruleset(self, ruleset) -> AbstractRuleSet:
        # deserialize ruleset JSON from DB to a ruleset object from decision_rules
        return JSONSerializer.deserialize(
            ruleset.ruleset, RULESET_TYPE_MAPPING[ruleset.attached_to_dataset.project.type_of_problem])

    def validate_format_type(self, format_type):
        if format_type not in settings.ALLOWED_DOWNLOAD_TYPES:
            raise ValidationError()

    def create_file_response(self, dataset, format_type, df, file_name_suffix='', index=True):
        self.validate_format_type(format_type)
        file = self.prepare_file(df, format_type=format_type, index=index)
        filename = f"{dataset.name}{file_name_suffix}.{format_type}"
        return FileResponse(file, as_attachment=True, filename=filename)


class DownloadDatasetView(DownloadViewsMixin, DatasetBaseView):
    """
    Download dataset as a csv or xlsx file.
    Args:
        dataset_id (str): ID of the dataset
    Returns:
        FileResponse: The HTTP response containing the dataset as a csv file.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['download']

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="download_dataset")
    parser = ModifyRequestParser()

    def put(self, request: Request, *args, **kwargs):
        dataset: Dataset = self.get_object()

        if 'name' not in request.data:
            request.data['name'] = dataset.name

        try:
            format_type = request.query_params.get('format_type', 'csv')
            self.validate_format_type(format_type)
        except ValidationError as e:
            raise UnsupportedDownloadFileTypeException()
        params: DatasetReadParams = self.parser.parse_request_params(request)
        df: pd.DataFrame
        df, _ = dataset.read_dataset_from_storage(params)
        return self.create_file_response(dataset, format_type, df)


class DownloadRuleFilteredDatasetView(DownloadViewsMixin, DatasetBaseView):
    """
    Download dataset as a csv or xlsx file, filtered based on the provided ruleset.
    """
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['download']

        def get_request_serializer(self, path, method):
            return RulesetModifyJSONSerializer()

        def get_response_serializer(self, path, method):
            return None

        def get_operation(self, path, method):
            op = super().get_operation(path, method)
            op['parameters'].append(
                {"name": "operator", "in": "query", "required": False, 'schema': {'type': 'string'}})
            return op

    schema = _CustomSchema(operation_id_base="download_rules_filtered_dataset")
    serializer_class = RulesetModifyJSONSerializer
    request_parser = RulesetModifyRequestParser()

    def put(self, request: Request, *args, **kwargs):
        dataset: Dataset = self.get_object()
        project_type = dataset.project.type_of_problem
        try:
            format_type = request.query_params.get('format_type', 'csv')
            self.validate_format_type(format_type)
        except ValidationError as e:
            raise UnsupportedDownloadFileTypeException()

        if 'name' not in request.data:
            request.data['name'] = dataset.name
        dataset_name = request.data['name']
        ruleset = request.data.get('ruleset')
        params = None
        if ruleset is not None:
            params = self.request_parser.parse_request_params(
                request, problem_type=project_type)
        df, _ = dataset.read_dataset_from_storage(params)
        return self.create_file_response(dataset, format_type, df, file_name_suffix='-filtered', index=False)


class DownloadRulesetExampleCoverageView(DownloadViewsMixin, RulesetBaseView):
    """
    Download example coverage of a dataset by a ruleset as a csv file.
    Args:
        ruleset_id (str): ID of the ruleset
    Returns:
        FileResponse: The HTTP response containing the example coverage as a csv file.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['download']

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return None

    schema = _CustomSchema(
        operation_id_base="download_ruleset_example_coverage")
    serializer_class = RulesetModifyJSONSerializer
    request_parser = RulesetModifyRequestParser()

    def put(self, request: Request, *args, **kwargs):

        ruleset: Ruleset = self.get_object()
        dataset: Dataset = ruleset.attached_to_dataset
        project_type = dataset.project.type_of_problem
        try:
            format_type = self.request.query_params.get('format_type', 'csv')
            self.validate_format_type(format_type)
        except ValidationError as e:
            raise UnsupportedDownloadFileTypeException()
        deserializer_ruleset: AbstractRuleSet = self.deserialize_ruleset(
            ruleset)
        rule_strings = {rule["uuid"]: rule["string"]
                        for rule in ruleset.ruleset.get("rules", [])}
        if 'name' not in request.data:
            request.data['name'] = dataset.name
        ruleset_to_filter = request.data.get('ruleset')
        filter_params = None
        if ruleset_to_filter is not None:
            filter_params = self.request_parser.parse_request_params(
                request, problem_type=project_type)

        read_params_list: list[DatasetReadParams]
        rule_ids: list[str]
        read_params_list, rule_ids = self.parse_ruleset_to_read_params(
            deserializer_ruleset)
        results: pd.DataFrame = self.prepare_results_dataframe(
            dataset,  read_params_list, rule_ids, rule_strings, filter_params)
        return self.create_file_response(dataset, format_type, results, file_name_suffix=f"-{ruleset.name}-coverage", index=False)

    def prepare_results_dataframe(self, dataset: Dataset, params_list: list[DatasetReadParams], rule_ids: list[str], rule_strings: dict, filter_params: Optional[DatasetReadParams]) -> pd.DataFrame:
        df: pd.DataFrame
        df, _ = dataset.read_dataset_from_storage(filter_params)
        results: pd.DataFrame = pd.DataFrame(index=df.index)
        # iterate over read_params from each rule and add a column with 1 if datapoint is covered by the rule
        for read_params, rule_id in zip(params_list, rule_ids):
            data, _ = dataset.read_dataset_from_storage(read_params)
            # Use a textual representation of the rule.
            rule_string = rule_strings[rule_id]
            new_col = results.index.isin(data.index)
            new_col = pd.DataFrame({rule_string: new_col}, index=results.index)
            results = pd.concat([results, new_col], axis=1)
        results: pd.DataFrame = results.astype(int)
        return results

    def parse_ruleset_to_read_params(self, ruleset: AbstractRuleSet) -> tuple[list[DatasetReadParams], list[str]]:
        # parse deserialized ruleset object to a list of DatasetReadParams
        parser = RuleToFilterParser(ruleset)
        filter_list: FilterList = parser.parse_ruleset_to_filters()
        read_params_list: list[DatasetReadParams] = [
            DatasetReadParams(
                limit=None,
                offset=0,
                sort=[],
                columns=["index", ],
                filters=filters,
            )
            for filters in filter_list.filters
        ]
        return read_params_list, parser.parsed_rules_ids


class DownloadRulesetIndicatorsView(DownloadViewsMixin, RulesetBaseView):
    """
    Download indicators of rules in a ruleset as a csv file.
    Args:
        ruleset_id (str): ID of the ruleset
    Returns:
        FileResponse: The HTTP response containing the indicators as a csv file.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['download']

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="download_ruleset_indicators")

    def get(self, *args, **kwargs):
        ruleset: Ruleset = self.get_object()
        dataset = ruleset.attached_to_dataset
        try:
            format_type = self.request.query_params.get('format_type', 'csv')
            self.validate_format_type(format_type)
        except ValidationError as e:
            raise UnsupportedDownloadFileTypeException()
        deserialized_ruleset: AbstractRuleSet = self.deserialize_ruleset(
            ruleset)
        results = self.prepare_results(ruleset, deserialized_ruleset)
        return self.create_file_response(dataset, format_type, results, file_name_suffix=f"-{ruleset.name}-indicators", index=False)

    def prepare_results(self, db_ruleset: Ruleset, deserialized_ruleset: AbstractRuleSet) -> pd.DataFrame:
        db_rules = db_ruleset.rules.values_list("uuid", "indicators")
        results = pd.DataFrame()
        for i, rule in enumerate(deserialized_ruleset.rules):
            db_rule = next(filter(lambda x: str(x[0]) == rule.uuid, db_rules))
            rule_result = pd.DataFrame(
                {"rule": rule.uuid, "text": str(rule), **db_rule[1]}, index=[i])
            results = pd.concat([results, rule_result])
        return results


class DonwloadImportanceView(DownloadViewsMixin, RulesetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['download']

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="download_ruleset_importance")

    def get(self, *args, **kwargs):
        ruleset = self.get_object()
        dataset = ruleset.attached_to_dataset
        try:
            format_type = self.request.query_params.get('format_type', 'csv')
            self.validate_format_type(format_type)
        except ValidationError as e:
            raise UnsupportedDownloadFileTypeException()
        importance_of = self.request.query_params.get('importance_of', 'all')
        is_classification = dataset.project.type_of_problem == "classification"

        importance = self._get_importance(ruleset)
        results = self._prepare_results(
            importance, importance_of, is_classification)
        return self.create_file_response(dataset, format_type, results, file_name_suffix=f"-{ruleset.name}-{importance_of}-importance", index=False)

    def _get_importance(self, ruleset) -> dict:
        queryset = ImportanceResults.objects.filter(ruleset_id=ruleset.id)
        if not queryset.exists():
            raise NotFound(
                detail="Could not find any importance result for this ruleset.")

        importance_result = queryset.first()
        return {
            'condition_importance': importance_result.condition_importance,
            'attribute_importance': importance_result.attribute_importance
        }

    def _prepare_results(self, importances: dict, importance_of: str, is_classification: bool) -> pd.DataFrame:
        data = []
        include_type_column = importance_of == "all"
        if importance_of in ["all", "condition"]:
            if is_classification:
                self._add_rows_classification(
                    importances['condition_importance'], 'condition_importance', data, include_type_column)
            else:
                self._add_rows_non_classification(
                    importances['condition_importance'], 'condition_importance', data, include_type_column)

        if importance_of in ["all", "attribute"]:
            if is_classification:
                self._add_rows_classification(
                    importances['attribute_importance'], 'attribute_importance', data, include_type_column)
            else:
                self._add_rows_non_classification(
                    importances['attribute_importance'], 'attribute_importance', data, include_type_column)

        columns = ["Class", "Name", "Importance"] if is_classification else [
            "Name", "Importance"]
        if include_type_column:
            columns.append("Type")

        return pd.DataFrame(data, columns=columns)

    def _add_rows_classification(self, importance_data: dict, importance_type: str, data: list, include_type_column: bool):
        for category, items in importance_data.items():
            for item, importance in items.items():
                row = [category, item, importance]
                if include_type_column:
                    row.append(importance_type)
                data.append(row)

    def _add_rows_non_classification(self, importance_data: dict, importance_type: str, data: list, include_type_column: bool):
        for item, importance in importance_data.items():
            row = [item, importance]
            if include_type_column:
                row.append(importance_type)
            data.append(row)
