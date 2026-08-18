from abc import ABC
from abc import abstractmethod

import pandas as pd
from rolap_data_storage.abstract.exceptions import InvalidStateException


class AbstractDatasetWriter(ABC):

    def __init__(self, path: str) -> None:
        self._path: str = path
        self._closed: bool = False
        self._monkey_patch_write_method()

    def _monkey_patch_write_method(self) -> pd.DataFrame:
        tmp = self.write

        def write_wrapper(*args, **kwargs):
            if self._closed:
                raise InvalidStateException(
                    ''.join([
                        "Tried to call DatasetWriter's 'write' method multiple time",
                        "DatasetWriter object can only be used once."
                    ])
                )
            tmp(*args, **kwargs)
            self._closed = True

        self.write = write_wrapper

    @abstractmethod
    def write(self, df: pd.DataFrame) -> None:
        pass
