import pandas as pd
from exceptions import DatasetReadError
from rolap_data_storage.abstract import AbstractDatasetReader
from rolap_data_storage.implementations.sql import DBStorage
from rolap_data_storage.implementations.sql import DBStorageConfig
from settings import STORAGE_PARAMS
from sqlalchemy.pool import NullPool

storage: DBStorage = DBStorage(DBStorageConfig(
    **STORAGE_PARAMS), poolclass=NullPool)


def read_from_storage(storage_path: str) -> pd.DataFrame:
    dataset_reader: AbstractDatasetReader = storage.get_dataset_reader(
        path=storage_path
    )
    try:
        return dataset_reader.read()
    except Exception as e:
        raise DatasetReadError(e)
