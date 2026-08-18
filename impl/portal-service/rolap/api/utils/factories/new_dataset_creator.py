import re
from typing import Optional

import numpy as np
import pandas as pd
from django.conf import settings
from django.core.files.uploadedfile import TemporaryUploadedFile
from pandas.errors import EmptyDataError
from rolap.api.exceptions import ColumnCastingException
from rolap.api.exceptions import DatasetExistsException
from rolap.api.exceptions import DatasetMaxColumnsViolation
from rolap.api.exceptions import DatasetMaxRowsViolation
from rolap.api.exceptions import DatasetMaxSizeViolation
from rolap.api.exceptions import DatasetMaxSumSizeViolation
from rolap.api.exceptions import EmptyDatasetException
from rolap.api.exceptions import InvalidColumnNames
from rolap.api.exceptions import InvalidColumnSelection
from rolap.api.exceptions import InvalidColumnTypeException
from rolap.api.exceptions import InvalidDatasetException
from rolap.api.exceptions import InvalidEncodingException
from rolap.api.exceptions import InvalidLabelColumnValues
from rolap.api.exceptions import TooManyClassesException
from rolap.api.exceptions import EmptyColumnException
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.datasets import UploadDatasetRequest
from rolap.api.models.projects import Project
from rolap.api.utils.helper import check_special_columns_values
from rolap.api.utils.helper import validate_uploaded_dataset_attributes_for_problem_type
from rolap.api.utils.limits import UserLimits
from rolap.api.utils.unimportant_attributes import \
    determine_unimportant_attributes


def cast_column_to_type(column: pd.Series, col_name: str, cast_to_type: str) -> pd.Series:
    allowed_types = [DatasetAttributes.DataAttributeTypes.NUMERICAL,
                     DatasetAttributes.DataAttributeTypes.CATEGORICAL]
    if cast_to_type not in allowed_types:
        raise InvalidColumnTypeException(
            col_type=cast_to_type, allowed_types=allowed_types)

    try:
        if cast_to_type == DatasetAttributes.DataAttributeTypes.NUMERICAL:
            original_non_null_count = column.notnull().sum()
            converted_column = pd.to_numeric(column, errors='coerce')
            new_non_null_count = converted_column.notnull().sum()
            if new_non_null_count < original_non_null_count:
                raise ColumnCastingException(
                    col_name=col_name,
                    col_type=cast_to_type
                )
        else:
            null_cells = column.isnull()
            converted_column = column.astype(str).mask(null_cells, None)

    except Exception:
        raise ColumnCastingException(
            col_name=col_name,
            col_type=cast_to_type
        )

    return converted_column


class NewDatasetCreator:

    ATTRIBUTES_REGEX = re.compile(settings.ATTRIBUTES_REGEX)

    def __init__(self, dataset_request: UploadDatasetRequest, project: Project, limits: UserLimits):
        self.dataset_request = dataset_request
        self.project = project
        self.limits = limits

    def create_new_dataset(self) -> Dataset:
        # check file compliance
        self._check_file_compliance(self.dataset_request.file)
        # prepare dataframe
        df: pd.DataFrame = self.prepare_dataframe(
            self.dataset_request.file, self.dataset_request)
        # validate number of columns and types of special columns
        validate_uploaded_dataset_attributes_for_problem_type(
            self.dataset_request, self.project.type_of_problem
        )
        # check special columns values
        labels: pd.Series = self._get_label_column(df)
        surv_time_col: pd.Series = self._get_survival_time_column_name(df)
        check_special_columns_values(self.project, labels, surv_time_col)
        # check dataframe compliance
        self._check_dataframe_compliance(df)
        # prepare dataset object
        dataset: Dataset = self._prepare_dataset_object(
            self.project, self.dataset_request, df)
        # validate dataset
        self._validate(self.project, self.dataset_request)
        # write correlation matrix
        corr_matrix = df.corr(
            numeric_only=True).round(settings.ROUND_DECIMAL_PLACES)
        dataset.correlation_matrix = corr_matrix.to_json()
        if self.project.type_of_problem == Project.CLASSIFICATION:
            cls_distribution = self._calculate_class_distribution(
                df, self.dataset_request)
            dataset.class_distribution = cls_distribution
        dataset.save()
        self._sanitize_label_columns(df, labels)
        # save attributes to db
        self._save_attributes_to_db(df, self.dataset_request, dataset)
        # save dataset to storage
        dataset.write_dataset_to_storage(df, self.dataset_request.file.size)
        # Determine unimportant attributes
        target_column = dataset.class_attribute
        unimportant_attributes_info = determine_unimportant_attributes(
            df, target_column)
        dataset.unimportant_attributes = unimportant_attributes_info
        dataset.save(update_fields=['unimportant_attributes'])

        return dataset

    def _check_file_compliance(self, file: TemporaryUploadedFile):
        # check size limit for file
        if file.size > self.limits.max_size:
            raise DatasetMaxSizeViolation(self.limits.max_size, file.size)
        # check limit for total size of storage
        if self.limits.space_used + file.size > self.limits.max_sum_size:
            raise DatasetMaxSumSizeViolation(
                self.limits.max_sum_size, self.limits.space_used + file.size)

    def _check_dataframe_compliance(self, df: pd.DataFrame):
        # check limit for number of rows
        if len(df) > self.limits.max_rows:
            raise DatasetMaxRowsViolation(self.limits.max_rows, len(df))
        # check limit for number of columns
        if len(df.columns) > self.limits.max_columns:
            raise DatasetMaxColumnsViolation(
                self.limits.max_columns, len(df.columns))

    def prepare_dataframe(
        self,
        file: TemporaryUploadedFile,
        upload_request: UploadDatasetRequest
    ) -> pd.DataFrame:
        # validate encoding type
        upload_request.encoding = upload_request.encoding.lower()
        if upload_request.encoding not in settings.ALLOWED_CODECS:
            raise InvalidEncodingException(upload_request.encoding)

        # try to read the dataset
        try:
            dtype_dict = {col_index: 'str' for col_index, col_type in zip(
                upload_request.selected_columns, upload_request.assigned_column_types) if col_type == 'cat'}
            df: pd.DataFrame = pd.read_csv(
                file,
                delimiter=upload_request.delimiter,
                encoding=upload_request.encoding,
                decimal=upload_request.decimal_separator,
                na_values=upload_request.missing_value_sign,
                header=0 if upload_request.header else None,
                usecols=upload_request.selected_columns,
                dtype=dtype_dict
            )
        except EmptyDataError:
            raise EmptyDatasetException()
        except ValueError:
            raise InvalidColumnSelection(
                "Error when selecting columns. Check whether the columns you wish to select exist in this dataset, or whether delimiter and/or decimal separator are correct.")
        except Exception:
            raise InvalidDatasetException()

        # check if the dataset is empty
        if df.empty:
            raise EmptyDatasetException()

        # check if the entire column is empty
        empty_columns = df.columns[(df.isnull() | (df == '')).all()]
        if not empty_columns.empty:
            empty_col_names = ', '.join(empty_columns)
            raise EmptyColumnException(empty_col_names)

        # if the dataset has no header, create column names
        if not upload_request.header:
            new_columns = self._create_columns(upload_request)
            df.columns = new_columns

        # strip column names of trailing and leading whitespaces
        df.columns = df.columns.str.strip()

        # fill in empty column names
        df.columns = [
            f"Column {i}" if (pd.isna(col) or str(col).strip() == "" or str(
                col).lower().startswith("unnamed")) else col
            for i, col in enumerate(df.columns)
        ]
        # make sure they conform to the allowed pattern
        checked = list(filter(self.ATTRIBUTES_REGEX.match, df.columns))
        if len(checked) < len(df.columns):
            wrong_columns = list(set(df.columns) - set(checked))
            raise InvalidColumnNames(wrong_columns)

        return df

    def _create_columns(self, upload_request: UploadDatasetRequest):
        """Create column names if the dataset has no header."""
        columns = []
        index = 1
        for column_class in upload_request.assigned_column_classes:
            # if it's an attribute, just name it Column_1, Column_2, etc.
            if column_class == DatasetAttributes.DataAttributeRoles.ATTRIBUTE:
                name = f"Column_{index}"
                index += 1
            # depending on the type of problem, name the target column accordingly
            else:
                if self.project.type_of_problem == Project.SURVIVAL:
                    if column_class == DatasetAttributes.DataAttributeRoles.SURVIVAL_TIME:
                        name = "Survival_Time"
                    else:
                        name = "Survival_Status"
                elif self.project.type_of_problem == Project.CLASSIFICATION:
                    name = "Class"
                else:
                    name = "Target"
            columns.append(name)
        return columns

    def _calculate_class_distribution(self, df: pd.DataFrame, upload_request: UploadDatasetRequest) -> dict:
        try:
            target_column_index = upload_request.assigned_column_classes.index(
                "class")
        except ValueError:
            raise InvalidColumnSelection(
                "No target column specified.")
        try:
            target_attribute = df.columns[target_column_index]
        except IndexError:
            raise InvalidColumnSelection(
                "Target column index out of bounds.")
        class_distribution = df[target_attribute].dropna(
        ).value_counts().to_dict()

        return class_distribution

    def _validate(self, project: Project, upload_request: UploadDatasetRequest) -> None:
        # then validate if dataset with given name exists
        if Dataset.objects\
                .filter(project_id=project.pk)\
                .filter(name=upload_request.name).exists():
            raise DatasetExistsException()

    def _prepare_dataset_object(
        self,
        project: Project,
        upload_request: UploadDatasetRequest,
        df: pd.DataFrame,
    ) -> Dataset:
        description = upload_request.description if upload_request.description else None
        dataset: Dataset = Dataset(
            project=project,
            name=upload_request.name,
            description=description,
            delimiter=upload_request.delimiter,
            number_of_rows=len(df),
            number_of_columns=len(df.columns)
        )
        return dataset

    def _save_attributes_to_db(
        self,
        df: pd.DataFrame,
        upload_request: UploadDatasetRequest,
        dataset: Dataset
    ):
        # save all dataset attributes to the database
        for index, col in enumerate(df.columns.tolist()):
            col_type = upload_request.assigned_column_types[index]

            df[col] = cast_column_to_type(
                df[col], col, cast_to_type=col_type)
            attribute: DatasetAttributes = DatasetAttributes(
                name=col,
                type=upload_request.assigned_column_types[index],
                role=upload_request.assigned_column_classes[index]
            )

            if col_type == DatasetAttributes.DataAttributeTypes.NUMERICAL:
                attribute.min = df[col].min()
                attribute.max = df[col].max()
                attribute.average = round(
                    df[col].mean(), settings.ROUND_DECIMAL_PLACES)

            if col_type == DatasetAttributes.DataAttributeTypes.CATEGORICAL:
                if df[col].dropna().empty:
                    attribute.mode = None
                else:
                    attribute.mode = f"{df[col].value_counts().idxmax()}"
                unique = df[col].dropna().unique().tolist()
                attribute.unique_values = unique

            attribute.missing_values_count = df[col].isna().sum()
            attribute.dataset = dataset
            attribute.save()

    def _get_label_column(self, df: pd.DataFrame) -> pd.Series:
        label_column_index = self.dataset_request.assigned_column_classes.index(
            DatasetAttributes.DataAttributeRoles.CLASSIFICATION
        )
        labels: pd.Series = df.iloc[:, label_column_index].copy()

        if self.project.type_of_problem == Project.CLASSIFICATION:
            # the dataset cannot have more classes than the limit
            class_count = labels.nunique()
            if class_count > settings.MAX_CLASSES:
                raise TooManyClassesException()

        # normalize survival status column to integers
        if self.project.type_of_problem == Project.SURVIVAL:
            try:
                not_empty_mask = np.negative(labels.isnull())
                labels.loc[not_empty_mask] = labels.loc[not_empty_mask].astype(
                    float).astype(int).astype(str)
            except (ValueError, pd.errors.IntCastingNaNError) as error:
                raise InvalidLabelColumnValues(
                    self.project.type_of_problem
                ) from error
            df.iloc[:, label_column_index] = labels
        return labels

    def _get_survival_time_column_name(self, df: pd.DataFrame) -> Optional[pd.Series]:
        if self.project.type_of_problem != Project.SURVIVAL:
            return None
        survival_time_index = self.dataset_request.assigned_column_classes.index(
            DatasetAttributes.DataAttributeRoles.SURVIVAL_TIME
        )
        return df.iloc[:, survival_time_index]

    def _sanitize_label_columns(self, df: pd.DataFrame, labels: pd.Series):
        if self.project.type_of_problem != Project.SURVIVAL:
            return
        try:
            df[labels.name] = labels.astype(int).astype(str)
        except ValueError as error:
            raise InvalidLabelColumnValues(
                self.project.type_of_problem
            ) from error

    def _check_class_distribution(self, df):
        if self.project.type_of_problem != Project.CLASSIFICATION:
            return
