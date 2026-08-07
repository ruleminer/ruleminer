from rolap_data_storage.abstract import AbstractDatasetReader
from rolap_data_storage.abstract import AbstractDatasetWriter
from rolap_data_storage.abstract import AbstractDataStorage
from rolap_data_storage.implementations.aws.config import AWSStorageConfig
from rolap_data_storage.implementations.aws.reader import AWSDatasetReader
from rolap_data_storage.implementations.aws.writer import AWSDatasetWriter


class AWSStorage(AbstractDataStorage):

    def __init__(self, config: AWSStorageConfig) -> None:
        super().__init__()
        self._config: AWSStorageConfig = config

    def get_dataset_reader(self, path: str) -> AbstractDatasetReader:
        return AWSDatasetReader(path, self._config)

    def get_dataset_writer(self, path: str) -> AbstractDatasetWriter:
        return AWSDatasetWriter(path, self._config)
