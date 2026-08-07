from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from typing import Optional
from typing import Union

import numpy as np
import pandas as pd
from django.conf import settings
from django.db.models import QuerySet
from rolap.api import exceptions
from rolap.api.models import DatasetAttributes
from rolap.api.models import Project
from rolap.api.models.datasets import UploadDatasetRequest


def parse_boolean(value: Union[str, int]) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        value: str = value.strip().lower()
    if value in ['1', 'yes', 'true', 1]:
        return True
    if value in ['0', 'no', 'false', 0]:
        return False
    raise ValueError(
        f'Cannot parse "{value}" to boolean value.' +
        'Supported types are integer (0, 1) or string (1, 0, yes, no, true, false) case insensitive'
    )


def sanitize_float(value: Any) -> Any:
    """Sanitize float and prepare it to be returned in request response object.
    This function do the following things:
        * Change inf and -inf floats to "inf" and "-inf" string
        * Round float value to the configured decimal places
        * Replace nan values with None
    Args:
        value (Any): value to sanitize

    Returns:
        Any: sanitized value
    """
    if isinstance(value, float):
        if np.isnan(value):
            return None
        elif np.isinf(value):
            if value > 0:
                return "inf"
            else:
                return "-inf"
        return round(value, settings.ROUND_DECIMAL_PLACES)
    return value


def sanitize_data(data: Any) -> Any:
    """Sanitize response data. This function calls sanitize_float function
    on all of the object's float members

    Args:
        data (Any): data to sanitize

    Returns:
        Any: sanitized data
    """
    if isinstance(data, dict):
        return {key: sanitize_data(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    elif isinstance(data, np.int64):
        return int(data)
    else:
        return sanitize_float(data)


@dataclass
class _DatasetAttributeInfo:
    type: str
    role: str

    @staticmethod
    def from_dataset_attributes(
        dataset_attributes_query: QuerySet
    ) -> list[_DatasetAttributeInfo]:
        return [
            _DatasetAttributeInfo(
                type=attribute.type,
                role=attribute.role
            ) for attribute in dataset_attributes_query
        ]

    @staticmethod
    def from_upload_dataset_request(
        upload_dataset_request: UploadDatasetRequest
    ) -> list[_DatasetAttributeInfo]:
        return [
            _DatasetAttributeInfo(type=e[0], role=e[1])
            for e in zip(
                upload_dataset_request.assigned_column_types,
                upload_dataset_request.assigned_column_classes
            )
        ]


def _validate_attributes_for_problem_type(
    attributes_infos: list[_DatasetAttributeInfo],
    problem_type: str
) -> None:
    # validate number of attributes
    min_attrs = 3 if problem_type == Project.SURVIVAL else 2
    attributes_count: int = len(attributes_infos)
    if attributes_count < min_attrs:
        raise exceptions.InvalidColumnNumberException(
            attributes_count, min_attrs, problem_type
        )

    # validate special attributes types
    NUMERICAL_TYPE: str = DatasetAttributes.DataAttributeTypes.NUMERICAL
    CATEGORICAL_TYPE: str = DatasetAttributes.DataAttributeTypes.CATEGORICAL
    label_attribute: DatasetAttributes = next((
        a for a in attributes_infos
        if a.role == DatasetAttributes.DataAttributeRoles.CLASSIFICATION),
        None
    )
    if label_attribute is None:
        raise exceptions.NoLabelAttributeSpecifiedException()
    if problem_type == Project.CLASSIFICATION:
        # expects label attribute to be categorical for classification problem
        if label_attribute.type != CATEGORICAL_TYPE:
            raise exceptions.InvalidAttributeTypeException(
                label_attribute.role, CATEGORICAL_TYPE, label_attribute.type,
            )
    elif problem_type == Project.REGRESSION:
        # expects label attribute to be numerical for regression problem
        if label_attribute.type != NUMERICAL_TYPE:
            raise exceptions.InvalidAttributeTypeException(
                label_attribute.role, NUMERICAL_TYPE, label_attribute.type,
            )
    elif problem_type == Project.SURVIVAL:
        # expects label attribute to be categorical for survival problem
        if label_attribute.type != CATEGORICAL_TYPE:
            raise exceptions.InvalidAttributeTypeException(
                label_attribute.role, CATEGORICAL_TYPE, label_attribute.type,
            )
        survival_time_attr: DatasetAttributes = next((
            a for a in attributes_infos
            if a.role == DatasetAttributes.DataAttributeRoles.SURVIVAL_TIME),
            None
        )
        if survival_time_attr is None:
            raise exceptions.MissingParameterException(
                str(DatasetAttributes.DataAttributeRoles.SURVIVAL_TIME)
            )
        if survival_time_attr.type != NUMERICAL_TYPE:
            # expects survival time attribute to be numerical
            raise exceptions.InvalidAttributeTypeException(
                survival_time_attr.role, NUMERICAL_TYPE, survival_time_attr.type,
            )


def validate_uploaded_dataset_attributes_for_problem_type(
    upload_dataset_request: UploadDatasetRequest,
    problem_type: str
) -> None:
    attributes_infos = _DatasetAttributeInfo.from_upload_dataset_request(
        upload_dataset_request
    )
    return _validate_attributes_for_problem_type(attributes_infos, problem_type)


def validate_dataset_attributes_for_problem_type(
    dataset_attributes_query: QuerySet,
    problem_type: str
) -> None:
    attributes_infos = _DatasetAttributeInfo.from_dataset_attributes(
        dataset_attributes_query
    )
    return _validate_attributes_for_problem_type(attributes_infos, problem_type)


def check_special_columns_values(
    project: Project,
    label_column: pd.Series,
    survival_time: Optional[pd.Series] = None,
):
    if label_column.isnull().any():
        # label column cannot contain empty values
        raise exceptions.EmptyLabelColumnValues()
    if project.type_of_problem == Project.CLASSIFICATION:
        # label column for classification problem should have at least 2 unique values
        if label_column.nunique() < 2:
            raise exceptions.InvalidLabelColumnValues(
                project.type_of_problem
            )
    elif project.type_of_problem == Project.SURVIVAL:
        try:
            survival_time = survival_time.astype(float)
        except ValueError as error:
            raise exceptions.InvalidSurvivalTimeColumnValues() from error
        if survival_time.isnull().any():
            # survival time column cannot contain empty values
            raise exceptions.EmptySurvivalTimeColumnValues()
        # label / survival_status column for survival problem should have maximum 2 unique values of 0 and 1
        unique_label_values: list[str] = sorted(
            label_column.astype(str).unique().tolist()
        )
        contains_elements_different_than_0_and_1: bool = len(
            set(unique_label_values).difference({'0', '1'})
        ) != 0
        if len(unique_label_values) != 2 or contains_elements_different_than_0_and_1:
            raise exceptions.InvalidLabelColumnValues(
                project.type_of_problem
            )
        # survival_time column values must be greater than 0.0
        if survival_time.min() <= 0.0:
            raise exceptions.InvalidSurvivalTimeColumnValues()
