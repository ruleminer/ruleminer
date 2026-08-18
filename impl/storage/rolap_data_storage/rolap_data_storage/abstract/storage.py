from abc import ABC
from abc import abstractmethod

from rolap_data_storage.abstract.reader import AbstractDatasetReader
from rolap_data_storage.abstract.writer import AbstractDatasetWriter


class AbstractDataStorage(ABC):
    @abstractmethod
    def get_dataset_reader(
        self,
        path: str
    ) -> AbstractDatasetReader:
        pass

    @abstractmethod
    def get_dataset_writer(
        self,
        path: str
    ) -> AbstractDatasetWriter:
        pass
