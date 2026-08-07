import json

import pandas as pd
from django.http import FileResponse
from django.http import Http404
from pandas.api.types import is_numeric_dtype
from pandas.api.types import is_string_dtype
from pandas.errors import EmptyDataError
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import ColumnCastingException
from rolap.api.exceptions import DatasetMaxColumnsViolation
from rolap.api.exceptions import DatasetMaxRowsViolation
from rolap.api.exceptions import DatasetMaxSizeViolation
from rolap.api.exceptions import EmptyDatasetException
from rolap.api.exceptions import InconsistentColumnTypesException
from rolap.api.exceptions import InvalidColumnSelection
from rolap.api.exceptions import InvalidDatasetException
from rolap.api.exceptions import MissingColumn
from rolap.api.exceptions import NoFileProvidedException
from rolap.api.exceptions import RulesetNotFoundException
from rolap.api.exceptions import UnsupportedDownloadFileTypeException
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.datasets import UploadDatasetRequest
from rolap.api.models.indicators import CalculatePredictionRequest
from rolap.api.models.projects import Project
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.serializers.rulesets.rulesets import \
    RequestPredictionOnDatasetSerializer
from rolap.api.utils.factories import cast_column_to_type
from rolap.api.utils.factories import NewDatasetCreator
from rolap.api.utils.http import IndicatorHttpService
from rolap.api.views.base import DatasetBaseView
from rolap.api.views.download import DownloadViewsMixin
from rolap.api.views.limits import UserLimits


class DatasetRulesPredictionView(DatasetBaseView, DownloadViewsMixin):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['results_calc']

        def get_request_serializer(self, path, method):
            return RequestPredictionOnDatasetSerializer()

        def get_response_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="prediction-on-uploaded")
    serializer_class = RequestPredictionOnDatasetSerializer

    def put(self, request: Request, dataset_id: int) -> Response:
        """
        Process a PUT request to perform predictions on an uploaded dataset with provided ruleset and return the results as a downloadable file.

        Parameters:
        - request (Request): The request object, which should include the dataset file and related data.
        - dataset_id (int): The identifier of the dataset from which the rule set was generated, which is to be used for prediction.

        Returns:
        - Response: A Django REST Framework response object that contains the file - dataset with prediction results.

        Raises:
        - UnsupportedDownloadFileTypeException: If the provided format type is not supported.
        - NoFileProvidedException: If no file is found in the request.
        - RulesetNotFoundException: If the specified original ruleset is not found.
        - InvalidDatasetException: If there are issues with the dataset file format or content.
        - MissingColumn: If the uploaded dataset is missing expected columns.
        """
        format_type = self._get_format_type(request)
        file_obj = self._validate_file(request)
        request_data = json.loads(request.data['data'])
        request_serializer: RequestPredictionOnDatasetSerializer = self._validate_serializer(
            request_data)
        try:
            initial_df = pd.read_csv(
                file_obj,
                delimiter=request_serializer.validated_data['dataset_info']['delimiter'],
                encoding=request_serializer.validated_data['dataset_info']['encoding'],
                decimal=request_serializer.validated_data['dataset_info']['decimal_separator'],
                na_values=request_serializer.validated_data['dataset_info']['missing_value_sign'],
                header=0
            )
        except EmptyDataError:
            raise EmptyDatasetException()
        except ValueError:
            raise InvalidColumnSelection(
                "Error when selecting columns. Check whether the columns you wish to select exist in this dataset, or whether delimiter and/or decimal separator are correct.")
        except Exception:
            raise InvalidDatasetException()
        file_obj.seek(0)
        self._check_dataframe_compliance(initial_df)
        dataset: Dataset = self.get_object()
        project: Project = dataset.project
        type_of_problem: str = project.type_of_problem

        original_ruleset: Ruleset = self._get_original_ruleset(
            request_serializer)
        self._validate_columns(initial_df, dataset)
        self._validate_column_types(initial_df, dataset)
        upload_request = self._prepare_upload_request(
            initial_df, request_serializer, dataset, file_obj)
        # Create a NewDatasetCreator object and prepare the DataFrame from file
        dataset_creator = NewDatasetCreator(
            upload_request, project, UserLimits(dataset.owner))
        uploaded_df: pd.DataFrame = dataset_creator.prepare_dataframe(
            file_obj, upload_request)

        df_json = uploaded_df.to_json(orient='records', date_format='iso')
        predictions = self._get_predictions(
            type_of_problem, request_serializer, df_json, original_ruleset)
        uploaded_df['prediction'] = predictions

        return self._create_file_response(uploaded_df, format_type)

    def _get_format_type(self, request) -> str:
        try:
            format_type = request.query_params.get('format_type', 'csv')
            self.validate_format_type(format_type)
        except ValidationError:
            raise UnsupportedDownloadFileTypeException()
        return format_type

    def _validate_file(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            raise NoFileProvidedException()
        if file_obj.size > self.limits.max_size:
            raise DatasetMaxSizeViolation(self.limits.max_size, file_obj.size)
        return file_obj

    def _validate_serializer(self, request_data) -> RequestPredictionOnDatasetSerializer:
        serializer = RequestPredictionOnDatasetSerializer(
            data=request_data)
        serializer.is_valid(raise_exception=True)
        return serializer

    def _get_original_ruleset(self, serializer):
        try:
            return get_object_or_404(Ruleset, pk=serializer.validated_data['ruleset_info']['original_ruleset_id'])
        except Http404:
            raise RulesetNotFoundException()

    def _get_predictions(
            self,
            type_of_problem: str,
            serializer: RequestPredictionOnDatasetSerializer,
            df_json,
            original_ruleset: Ruleset):
        indicator_service = IndicatorHttpService()
        # get prediction config and update it from request
        prediction_config = original_ruleset.get_updated_config(
            serializer.data.get('prediction_config', {})
        )
        payload = CalculatePredictionRequest(
            type=type_of_problem,
            ruleset=serializer.validated_data['ruleset_info']['ruleset'],
            rule_coverage=serializer.validated_data['ruleset_info']['rule_coverage'],
            prediction_config=prediction_config,
            df_X=df_json,
        )
        return indicator_service.calculate_prediction(payload)

    def _create_file_response(self, df: pd.DataFrame, format_type: str) -> FileResponse:
        file = self.prepare_file(df, format_type=format_type, index=False)
        filename = f"prediction_results.{format_type}"
        return FileResponse(file, as_attachment=True, filename=filename)

    def _prepare_upload_request(self, df: pd.DataFrame, serializer, dataset: Dataset, file_obj) -> UploadDatasetRequest:
        original_columns = {
            attr.name: attr for attr in dataset.attributes.all()}
        submitted_columns = list(df.columns)

        selected_columns = []
        assigned_column_types = []
        assigned_column_classes = []

        for col in submitted_columns:
            if col in original_columns and original_columns[
                    col].role != DatasetAttributes.DataAttributeRoles.CLASSIFICATION:
                selected_columns.append(submitted_columns.index(col))
                assigned_column_types.append(original_columns[col].type)
                assigned_column_classes.append(original_columns[col].role)
            else:
                assigned_column_types.append(
                    DatasetAttributes.DataAttributeTypes.CATEGORICAL)
        return UploadDatasetRequest(
            name=dataset.name,
            description="",
            file=file_obj,
            selected_columns=selected_columns,
            assigned_column_types=assigned_column_types,
            assigned_column_classes=assigned_column_classes,
            delimiter=serializer.validated_data['dataset_info']['delimiter'],
            decimal_separator=serializer.validated_data['dataset_info']['decimal_separator'],
            missing_value_sign=serializer.validated_data['dataset_info']['missing_value_sign'],
            encoding=serializer.validated_data['dataset_info']['encoding'],
            header=True
        )

    def _validate_columns(self, df: pd.DataFrame, dataset: Dataset):
        required_columns = {attr.name for attr in dataset.attributes.all(
        ) if attr.role != DatasetAttributes.DataAttributeRoles.CLASSIFICATION}
        if not required_columns.issubset(set(df.columns)):
            missing_columns = required_columns - set(df.columns)
            raise MissingColumn(list(missing_columns))

    def _validate_column_types(self, df: pd.DataFrame, dataset: Dataset):
        attributes = [
            (attr.name, attr.type)
            for attr in dataset.attributes.filter(
                name__in=df.columns, role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE
            )
        ]
        categorical_attrs = []
        numeric_attrs = []
        for col_name, col_type in attributes:
            if col_type == DatasetAttributes.DataAttributeTypes.CATEGORICAL:
                categorical_attrs.append(col_name)
            else:
                numeric_attrs.append(col_name)
        categorical_df = df[categorical_attrs]
        numeric_df = df[numeric_attrs]
        categorical = categorical_df.dtypes.apply(is_string_dtype)
        numeric = numeric_df.dtypes.apply(is_numeric_dtype)
        incorrect_categorical = categorical[~categorical].index.tolist()
        incorrect_numeric = numeric[~numeric].index.tolist()
        incorrectly_cast = incorrect_categorical + incorrect_numeric
        if incorrectly_cast:
            raise InconsistentColumnTypesException(incorrectly_cast)

    def _check_dataframe_compliance(self, df: pd.DataFrame):
        # check limit for number of rows
        if len(df) > self.limits.max_rows:
            raise DatasetMaxRowsViolation(self.limits.max_rows, len(df))
        # check limit for number of columns
        if len(df.columns) > self.limits.max_columns:
            raise DatasetMaxColumnsViolation(
                self.limits.max_columns, len(df.columns))
