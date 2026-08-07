from typing import List
from typing import Optional

import pandas as pd
from rolap_data_storage.abstract import AbstractDatasetReader
from rolap_data_storage.abstract import FilterConnector
from rolap_data_storage.abstract import FilterList
from rolap_data_storage.abstract import FilterOperators
from rolap_data_storage.abstract import SortInfo
from rolap_data_storage.implementations.aws.config import AWSStorageConfig


class FilterToMaskProcessor:
    def process(self, df: pd.DataFrame, filter_list: FilterList) -> pd.Series:
        mask: pd.Series = None
        for filter_ in filter_list.filters:
            if isinstance(filter_, FilterList):
                submask = self.process(df, filter_)
            else:
                column = df[filter_['column_name']]
                submask_mapping = {
                    FilterOperators.lower: lambda: (column < filter_['value']),
                    FilterOperators.greater: lambda: (column > filter_['value']),
                    FilterOperators.lower_equal: lambda: (column <= filter_['value']),
                    FilterOperators.greater_equal: lambda: (column >= filter_['value']),
                    FilterOperators.equal: lambda: (column == filter_['value']),
                    FilterOperators.not_equal: lambda: (column != filter_['value']),
                    FilterOperators.is_in: lambda: (
                        column.isin(filter_['value'])
                    ),
                    FilterOperators.is_not_in: lambda: (
                        ~column.isin(filter_['value'])
                    ),
                    FilterOperators.icontains: lambda: (
                        # it will fail badly on non-string columns!
                        column.astype(str).str.contains(
                            filter_['value'], case=False)
                    ),
                    FilterOperators.istartswith: lambda: (
                        # it will fail badly on non-string columns!
                        column.astype(str).str.startswith(
                            filter_['value'], case=False)
                    )
                }
                submask = submask_mapping[filter_['operator']]()
            if filter_list.connector == FilterConnector.AND:
                mask = submask if mask is None else mask & submask
            else:
                mask = submask if mask is None else mask | submask
        return mask


class AWSDatasetReader(AbstractDatasetReader):

    def __init__(
        self,
        path: str,
        config: AWSStorageConfig
    ) -> None:
        super().__init__(path=path)
        self._config: AWSStorageConfig = config
        self._df: pd.DataFrame = None

        self._selected_columns: Optional[List[str]] = None
        self._filters_info: FilterList = FilterList(
            connector=FilterConnector.AND, filters=[])
        self._sort_info: List[SortInfo] = []
        self._limit: int = None
        self._offset: int = 0

    def _read_df_from_storage(self) -> None:
        self._df = pd.read_parquet(
            f's3://{self._path}',
            storage_options={
                'key': self._config.aws_access_key_id,
                'secret': self._config.aws_secret_access_key,
                'client_kwargs': {
                    'endpoint_url': self._config.endpoint_url
                }
            },
            columns=self._selected_columns
        )

    def select_columns(self, columns: List[str]) -> None:
        if columns == ["index"]:
            columns = None
        self._selected_columns = columns

    def filter(self, filters_info: FilterList) -> None:
        self._filters_info = filters_info

    def _apply_filters(self) -> None:
        if not self._filters_info.filters:
            return
        processor = FilterToMaskProcessor()
        mask = processor.process(self._df, self._filters_info)
        self._df = self._df[mask]

    def sort(self, sort_info: List[SortInfo]) -> None:
        self._sort_info = sort_info

    def _apply_sorting(self) -> None:
        if len(self._sort_info) == 0:
            return
        self._df = self._df.sort_values(
            by=[e['column_name'] for e in self._sort_info],
            ascending=[e['ascending'] for e in self._sort_info]
        )

    def limit(self, limit: int, offset: int) -> None:
        self._limit = limit
        self._offset = offset

    def _apply_limiting(self):
        if self._limit is None:
            self._limit = self._df.shape[0]
        self._df = self._df.iloc[self._offset:self._offset+self._limit, :]

    def read(self) -> pd.DataFrame:
        self._read_df_from_storage()
        self._apply_filters()
        self._apply_sorting()
        self.total_count = len(self._df)
        self._apply_limiting()
        return self._df
