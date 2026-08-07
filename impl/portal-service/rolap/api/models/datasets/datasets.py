import uuid
from dataclasses import dataclass, field
from typing import List
from typing import Optional

import pandas as pd
from django.apps import apps
from django.contrib.contenttypes.fields import GenericRelation
from django.core.files.uploadedfile import TemporaryUploadedFile
from django.db import models
from django.utils.translation import gettext_lazy as _
from rolap.api.exceptions import DatasetReadWriteException
from rolap.api.storage import storage
from rolap_data_storage.abstract.reader import AbstractDatasetReader
from rolap_data_storage.abstract.reader import FilterConnector
from rolap_data_storage.abstract.reader import FilterInfo
from rolap_data_storage.abstract.reader import FilterList
from rolap_data_storage.abstract.reader import FilterOperators
from rolap_data_storage.abstract.writer import AbstractDatasetWriter
from rolap_data_storage.implementations.sql import DBStorageException


class Dataset(models.Model):
    class Meta:
        unique_together = ("project", "name", )

    id = models.AutoField(primary_key=True)
    project: models.ForeignKey = models.ForeignKey(
        "api.Project", on_delete=models.CASCADE, related_name='datasets')
    name: models.CharField = models.CharField(max_length=50)
    description = models.TextField(null=True, blank=True)
    delimiter = models.CharField(default=";")
    created_at = models.DateTimeField(auto_now=True)
    path = models.UUIDField(default=uuid.uuid4, editable=False)
    correlation_matrix = models.JSONField(null=True)
    number_of_rows = models.IntegerField(default=0)
    number_of_columns = models.IntegerField(default=0)
    reports = GenericRelation("api.Report")
    class_distribution = models.JSONField(null=True, blank=True)
    child_tasks = GenericRelation(
        "api.Task",
        content_type_field="source_content_type",
        object_id_field="source_object_id",
    )
    size = models.IntegerField(default=0)
    unimportant_attributes = models.JSONField(null=True, blank=True)

    @property
    def owner(self):
        return self.project.owner

    @property
    def ruleset_count(self):
        return self.attached_rulesets.count()

    @property
    def report_count(self):
        return self.reports.count()

    def read_dataset_from_storage(
            self,
            params: Optional['DatasetReadParams'] = None,
            complementary=False
    ) -> tuple[pd.DataFrame, int]:
        """Read dataframe associated with the dataset from storage service."""
        reader: AbstractDatasetReader = storage.get_dataset_reader(
            path=str(self.path)
        )
        if params is not None:
            self._apply_params(reader, params)
            if params.filters is not None:
                reader.filter(params.filters)
        try:
            if complementary:
                df = self._read_complementary_data(reader, params)
                total_count = self.number_of_rows - reader.total_count
            else:
                df = reader.read()
                total_count = reader.total_count
        except DBStorageException as e:
            raise DatasetReadWriteException(
                f"An error occurred during dataset read operation: {str(e)}")
        return df, total_count

    def _read_complementary_data(
            self,
            reader: AbstractDatasetReader,
            params: Optional['DatasetReadParams'] = None,
    ) -> pd.DataFrame:
        complementary_reader: AbstractDatasetReader = storage.get_dataset_reader(
            path=str(self.path)
        )
        if params is not None:
            self._apply_params(complementary_reader, params)
        reader.select_columns(["index"])
        index = reader.read()
        filters = FilterList(
            connector=FilterConnector.AND, filters=[
                FilterInfo(
                    column_name="index",
                    operator=FilterOperators.is_not_in,
                    value=index.index.tolist(),
                )
            ])
        complementary_reader.filter(filters)
        return complementary_reader.read()

    def _apply_params(self, reader: AbstractDatasetReader, params: 'DatasetReadParams'):
        reader.limit(params.limit or None, params.offset or 0)
        if params.columns is not None and len(params.columns) > 0:
            reader.select_columns(params.columns)
        if params.sort:
            reader.sort([
                {
                    'column_name': sort['selector'],
                    'ascending': not sort['desc']
                }
                for sort in params.sort
            ])

    def write_dataset_to_storage(self, df: pd.DataFrame, size=None):
        """Write dataframe to storage service."""
        path = str(self.path)
        writer: AbstractDatasetWriter = storage.get_dataset_writer(
            path=path
        )
        try:
            writer.write(df)
        except DBStorageException as e:
            raise DatasetReadWriteException(
                f"An error occurred during dataset write operation: {str(e)}")
        size = size or df.memory_usage().sum()
        self.size = size
        self.save()

    def prepare_column_info(self, params: 'DatasetReadParams') -> list['DatasetColumn']:
        """Prepare column info for API responses associated with datasets."""
        DatasetAttributes = apps.get_model("api.DatasetAttributes")
        dataset_attributes: list[DatasetAttributes] = DatasetAttributes.objects.filter(
            dataset_id=self.pk
        ).order_by("pk")
        columns: list[DatasetColumn] = []

        if len(params.columns) > 0:
            for attribute in dataset_attributes:
                if attribute.name in params.columns:
                    columns.append(DatasetColumn(
                        name=attribute.name, column_type=attribute.type, role=attribute.role))
        else:
            for attribute in dataset_attributes:
                columns.append(DatasetColumn(
                    name=attribute.name, column_type=attribute.type, role=attribute.role))
        return columns

    def delete_data(self):
        dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
            str(self.path))
        try:
            dataset_reader.delete()
        except DBStorageException as e:
            raise DatasetReadWriteException(
                f"An error occurred during dataset delete operation: {str(e)}")

    @property
    def class_attribute(self) -> str:
        cls_attr = self.attributes.filter(
            role=DatasetAttributes.DataAttributeRoles.CLASSIFICATION)
        if cls_attr.exists():
            return cls_attr.first().name

    @property
    def survival_time_attribute(self) -> str:
        survival_time_attr = self.attributes.filter(
            role=DatasetAttributes.DataAttributeRoles.SURVIVAL_TIME)
        if survival_time_attr.exists():
            return survival_time_attr.first().name


class DatasetAttributes(models.Model):
    class DataAttributeTypes(models.TextChoices):
        NUMERICAL = 'num', _("numerical")
        CATEGORICAL = 'cat', _("categorical")

    class DataAttributeRoles(models.TextChoices):
        ATTRIBUTE = 'attr'
        CLASSIFICATION = 'class'
        SURVIVAL_TIME = 'survival_time'

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=256)
    type = models.CharField(
        choices=DataAttributeTypes.choices, default=DataAttributeTypes.CATEGORICAL)
    role = models.CharField(
        choices=DataAttributeRoles.choices, default=DataAttributeRoles.ATTRIBUTE)
    min = models.FloatField(default=0)
    max = models.FloatField(default=0)
    average = models.FloatField(default=0)
    missing_values_count = models.IntegerField()
    dataset = models.ForeignKey(
        Dataset, on_delete=models.CASCADE, related_name="attributes")
    mode = models.CharField(max_length=255, null=True)
    unique_values = models.JSONField(null=True)

    @property
    def owner(self):
        return self.dataset.project.owner


@dataclass
class DatasetColumn(object):
    name: str
    column_type: str
    role: str


@dataclass
class DatasetRecord(object):
    id: int
    column_values: List[str]

    def __init__(self, id: int, column_values: List[str]):
        self.id = id
        self.column_values = column_values


@dataclass
class DatasetPreviewResponse(object):
    limit: int
    offset: int
    count: int
    columns: List[DatasetColumn]
    records: List[DatasetRecord]


@dataclass
class GetDatasetRequest(object):
    columns: List[str]


@dataclass
class UploadDatasetRequest(object):
    name: str
    file: TemporaryUploadedFile
    selected_columns: List[int]
    assigned_column_types: List[str]
    assigned_column_classes: List[str]
    delimiter: str
    decimal_separator: str
    missing_value_sign: Optional[str]
    encoding: str
    description: Optional[str]
    header: bool


@dataclass
class ModifyDatasetRequest(object):
    name: str
    columns: list[str]


@dataclass
class DatasetExtendedRecord(object):
    id: int
    applied_rules: List[str]
    predicted_value: str
    column_values: List[str]


@dataclass
class RecordsApplyRulesResponse(object):
    columns: List[DatasetColumn]
    records: List[DatasetExtendedRecord]


@dataclass
class DatasetReadParams(object):
    limit: Optional[int]
    offset: Optional[int]
    columns: Optional[list[str]]
    filters: Optional[FilterList]
    sort: Optional[list] = field(default_factory=list)
