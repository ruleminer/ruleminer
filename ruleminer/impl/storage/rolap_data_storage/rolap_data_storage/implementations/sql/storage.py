from rolap_data_storage.abstract import AbstractDatasetReader
from rolap_data_storage.abstract import AbstractDatasetWriter
from rolap_data_storage.abstract import AbstractDataStorage
from sqlalchemy import create_engine

from .config import DBStorageConfig
from .reader import DBDatasetReader
from .writer import DBDatasetWriter


class DBStorage(AbstractDataStorage):

    def __init__(self, config: DBStorageConfig, **kwargs) -> None:
        super().__init__()
        self.engine = create_engine(config.get_database_url(), **kwargs)

    def get_dataset_reader(self, path: str) -> AbstractDatasetReader:
        return DBDatasetReader(path, self.engine)

    def get_dataset_writer(self, path: str) -> AbstractDatasetWriter:
        return DBDatasetWriter(path, self.engine)

    def dispose(self):
        self.engine.dispose()
