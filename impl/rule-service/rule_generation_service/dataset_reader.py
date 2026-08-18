import pandas as pd
from decision_rules.core.ruleset import AbstractRuleSet
from exceptions import DatasetReadError
from models.common import Attribute
from rolap_data_storage.abstract import AbstractDatasetReader
from rolap_data_storage.abstract.reader import SortInfo
from rolap_data_storage.implementations.sql import DBStorage
from rolap_data_storage.implementations.sql import DBStorageConfig
from settings.common import STORAGE_PARAMS
from sqlalchemy.pool import NullPool

storage: DBStorage = DBStorage(DBStorageConfig(
    **STORAGE_PARAMS), poolclass=NullPool)


def read_from_storage(attributes: list[Attribute], storage_path: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    all_attributes, filtered_attributes, target_attributes = _process_attributes(
        attributes)

    dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
        path=storage_path
    )
    dataset_reader.select_columns(columns=all_attributes)
    dataset_reader.sort(sort_info=[
        SortInfo(ascending=True, column_name=filtered_attributes[0])
    ])
    try:
        df = dataset_reader.read()
    except Exception as e:
        raise DatasetReadError(e)

    x_df = df[filtered_attributes]
    y_df = df[target_attributes]

    return x_df, y_df


def read_columns(storage_path: str) -> list[str]:
    dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
        path=storage_path
    )
    dataset_reader.limit(limit=0, offset=0)
    try:
        df = dataset_reader.read()
    except Exception as e:
        raise DatasetReadError(e)

    return df.columns.tolist()


def read_with_ruleset(storage_path: str, ruleset: AbstractRuleSet) -> tuple[pd.DataFrame, pd.DataFrame]:
    all_attributes = ruleset.column_names + [ruleset.decision_attribute]
    dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
        path=storage_path
    )
    dataset_reader.select_columns(columns=all_attributes)
    try:
        df = dataset_reader.read()
    except Exception as e:
        raise DatasetReadError(e) from e
    X_df = df[ruleset.column_names]
    y_df = df[ruleset.decision_attribute]
    return X_df, y_df


def _process_attributes(attributes: list[Attribute]) -> tuple[list[str], list[str], str or list[str]]:
    filtered_attributes: list[str] = [
        attr.name for attr in attributes if attr.role == 'attr' or attr.role == 'survival_time']
    target_attributes: str = [
        attr.name for attr in attributes if attr.role == 'class'][0]

    all_attributes = filtered_attributes.copy()
    all_attributes.append(target_attributes)

    return all_attributes, filtered_attributes, target_attributes
