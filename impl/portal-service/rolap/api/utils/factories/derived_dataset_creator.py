import pandas as pd
from django.conf import settings
from django.db import IntegrityError
from keycloak_auth.models import User
from rolap.api.exceptions import DatasetExistsException
from rolap.api.exceptions import DatasetMaxColumnsViolation
from rolap.api.exceptions import DatasetMaxRowsViolation
from rolap.api.exceptions import DatasetMaxSizeViolation
from rolap.api.exceptions import DatasetMaxSumSizeViolation
from rolap.api.exceptions import EmptyDatasetException
from rolap.api.exceptions import InvalidColumnNumberException
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.projects import Project
from rolap.api.utils.helper import check_special_columns_values
from rolap.api.utils.limits import UserLimits
from rolap.api.utils.unimportant_attributes import \
    determine_unimportant_attributes


class DerivedDatasetCreator:
    def __init__(self, limits: UserLimits):
        self.limits = limits

    def create_new_dataset(self, old_dataset: Dataset, df: pd.DataFrame, **kwargs):
        if df.empty:
            raise EmptyDatasetException()
        self.validate_columns(old_dataset, df)
        old_df, _ = old_dataset.read_dataset_from_storage()
        new_approx_size = int(df.memory_usage().sum() /
                              old_df.memory_usage().sum()) * old_dataset.size
        # check special columns values
        check_special_columns_values(
            old_dataset.project,
            df[old_dataset.class_attribute],
            df[old_dataset.survival_time_attribute] if old_dataset.survival_time_attribute else None
        )
        self.check_dataset_size_compliance(df, new_approx_size)
        try:
            new_dataset = Dataset(
                project=old_dataset.project,
                delimiter=old_dataset.delimiter,
                number_of_rows=len(df),
                number_of_columns=len(df.columns),
                **kwargs
            )
            new_dataset.save()
        except IntegrityError:
            raise DatasetExistsException()
        self._save_attributes_to_db(old_dataset, new_dataset, df)
        new_dataset.write_dataset_to_storage(df, new_approx_size)
        if old_dataset.project.type_of_problem == Project.CLASSIFICATION:
            target_attribute = old_dataset.class_attribute
            cls_distribution = df[target_attribute].dropna(
            ).value_counts().to_dict()
            new_dataset.class_distribution = cls_distribution
            new_dataset.save(update_fields=['class_distribution'])

        # Determine unimportant attributes
        target_column = old_dataset.class_attribute
        unimportant_attributes_info = determine_unimportant_attributes(
            df, target_column)
        new_dataset.unimportant_attributes = unimportant_attributes_info
        new_dataset.save(update_fields=['unimportant_attributes'])

        return new_dataset

    def validate_columns(self, old_dataset: Dataset, df: pd.DataFrame):
        problem_type = old_dataset.project.type_of_problem
        if problem_type == Project.SURVIVAL:
            if len(df.columns) < 3:
                raise InvalidColumnNumberException(
                    number=len(df.columns), min_number=3, problem_type=problem_type)
        else:
            if len(df.columns) < 2:
                raise InvalidColumnNumberException(
                    number=len(df.columns), min_number=2, problem_type=problem_type)

    def _save_attributes_to_db(
            self,
            old_dataset: Dataset,
            new_dataset: Dataset,
            df: pd.DataFrame,
    ):
        # save all dataset attributes to the database
        for index, col in enumerate(df.columns.tolist()):
            old_attribute = old_dataset.attributes.get(name=col)
            new_attribute: DatasetAttributes = DatasetAttributes(
                name=col,
                type=old_attribute.type,
                role=old_attribute.role,
            )

            if old_attribute.type == DatasetAttributes.DataAttributeTypes.NUMERICAL:
                new_attribute.min = df[col].min()
                new_attribute.max = df[col].max()
                new_attribute.average = round(
                    df[col].mean(), settings.ROUND_DECIMAL_PLACES)

            if old_attribute.type == DatasetAttributes.DataAttributeTypes.CATEGORICAL:
                if df[col].dropna().empty:
                    new_attribute.mode = None
                else:
                    new_attribute.mode = f"{df[col].value_counts().idxmax()}"
                unique = df[col].dropna().unique().tolist()
                new_attribute.unique_values = unique

            new_attribute.missing_values_count = df[col].isna().sum()
            new_attribute.dataset = new_dataset
            new_attribute.save()

    def check_dataset_size_compliance(self, df: pd.DataFrame, new_approx_size: int):
        # check limit for total size of file
        # check size limit for file
        if new_approx_size > self.limits.max_size:
            DatasetMaxSizeViolation(self.limits.max_size, new_approx_size)
        # check limit for total size of storage
        if self.limits.space_used + new_approx_size > self.limits.max_sum_size:
            DatasetMaxSumSizeViolation(
                self.limits.max_sum_size, self.limits.space_used + new_approx_size)
        # check limit for number of rows
        if len(df) > self.limits.max_rows:
            DatasetMaxRowsViolation(self.limits.max_rows, len(df))
        # check limit for number of columns
        if len(df.columns) > self.limits.max_columns:
            DatasetMaxColumnsViolation(
                self.limits.max_columns, len(df.columns))
