from abc import ABC
from abc import abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Any
from typing import List
from typing import Optional
from typing import TypedDict
from typing import Union

import pandas as pd
from rolap_data_storage.abstract.exceptions import InvalidStateException


class SortInfo(TypedDict):
    column_name: str
    ascending: bool


class FilterOperators(Enum):
    equal: str = '='
    not_equal: str = '!='
    greater: str = '>'
    greater_equal: str = '>='
    lower: str = '<'
    lower_equal: str = '<='
    is_in: str = 'in'
    is_not_in: str = 'not in'
    icontains: str = 'icontains'
    istartswith: str = "istartswith"


class FilterInfo(TypedDict):
    column_name: str
    operator: FilterOperators
    value: Union[Any, List[Any]]
    value_is_column: bool = False


class FilterConnector(Enum):
    AND: str = "&"
    OR: str = "|"


@dataclass
class FilterList:
    connector: FilterConnector
    filters: list[Union[FilterInfo, 'FilterList']]


class AbstractDatasetReader(ABC):

    def __init__(self, path: str) -> None:
        self._path: str = path
        self._closed: bool = False
        self._monkey_patch_read_method()
        self.total_count: Optional[int] = None

    def _monkey_patch_read_method(self) -> pd.DataFrame:
        tmp = self.read

        def read_wrapper(*args, **kwargs):
            if self._closed:
                raise InvalidStateException(
                    ''.join([
                        "Tried to call DatasetReader's 'read' method multiple time",
                        "DatasetReader object can only be used once."
                    ])
                )
            results: pd.DataFrame = tmp(*args, **kwargs)
            self._closed = True
            return results

        self.read = read_wrapper

    @abstractmethod
    def select_columns(self, columns: List[str]) -> None:
        pass

    @abstractmethod
    def filter(self, filters_info: FilterList) -> None:
        pass

    @abstractmethod
    def sort(self, sort_info: List[SortInfo]) -> None:
        pass

    @abstractmethod
    def limit(self, limit: int, offset: int) -> None:
        pass

    @abstractmethod
    def read(self) -> pd.DataFrame:
        pass
