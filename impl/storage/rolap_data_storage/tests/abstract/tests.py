# pylint: disable=missing-module-docstring,missing-class-docstring,missing-function-docstring
import unittest
from typing import List

import pandas as pd
from pydantic import BaseModel
from rolap_data_storage.abstract import AbstractDatasetReader
from rolap_data_storage.abstract import AbstractDataStorage
from rolap_data_storage.abstract import FilterInfo
from rolap_data_storage.abstract import InvalidStateException
from rolap_data_storage.abstract import SortInfo


class DummyDatasetReader(AbstractDatasetReader):

    def __init__(self, path: str) -> None:
        super().__init__(path)

    def select_columns(self, columns: List[str]) -> None:
        pass

    def sort(self, sort_info: List[SortInfo]) -> None:
        pass

    def filter(self, filters_info: List[FilterInfo]) -> None:
        pass

    def limit(self, limit: int, offset: int) -> None:
        pass

    def read(self) -> pd.DataFrame:
        return pd.DataFrame([])


class DummyDatasetStorage(AbstractDataStorage):

    def initialize(self, config: BaseModel) -> None:
        pass

    def get_dataset_reader(
        self,
        path: str
    ) -> AbstractDatasetReader:
        pass

    def save_dataset(self, df: pd.DataFrame) -> str:
        pass


class TestAbstractDatasetReader(unittest.TestCase):

    def test_state(self):
        reader = DummyDatasetReader(path='dummy-path')
        reader.read()

        with self.assertRaises(InvalidStateException):
            reader.read()


if __name__ == '__main__':
    unittest.main()
