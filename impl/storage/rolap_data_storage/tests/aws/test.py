# pylint: disable=missing-module-docstring,missing-class-docstring,missing-function-docstring
import unittest
from typing import List

import numpy as np
import pandas as pd
from rolap_data_storage.abstract import FilterConnector
from rolap_data_storage.abstract import FilterInfo
from rolap_data_storage.abstract import FilterList
from rolap_data_storage.abstract import FilterOperators
from rolap_data_storage.implementations.aws import AWSDatasetReader
from rolap_data_storage.implementations.aws import AWSStorageConfig


class AWSTestDatasetReader(AWSDatasetReader):

    def _prepare_test_df(self) -> pd.DataFrame:
        return pd.DataFrame({
            'a': range(0, 100),
            'b': range(100, 200)
        })

    def _read_df_from_storage(self) -> pd.DataFrame:
        self._df = self._prepare_test_df()
        if self._selected_columns is not None:
            self._df = self._df[self._selected_columns]


class TestAWSDatasetReader(unittest.TestCase):

    def _preprare_config_mock(self) -> AWSStorageConfig:
        return AWSStorageConfig(
            endpoint_url='mock',
            aws_access_key_id='mock',
            aws_secret_access_key='mock'
        )

    def test_column_selection(self):
        reader: AWSDatasetReader = AWSTestDatasetReader(
            path='mock',
            config=self._preprare_config_mock()
        )
        reader.select_columns(['a'])
        df_readed: pd.DataFrame = reader.read()
        df_original: pd.DataFrame = reader._prepare_test_df()

        self.assertTrue(
            len(df_readed.columns) == 1 and ('a' in df_readed.columns),
            'Column selection should limit dataset columns'
        )
        self.assertTrue(pd.Series.equals(
            df_readed['a'], df_original['a']),
            'Column selection should not modify the data'
        )

    def test_filtering_operator_equal(self):
        reader: AWSDatasetReader = AWSTestDatasetReader(
            path='mock',
            config=self._preprare_config_mock()
        )
        VALUE: int = 10
        filters = FilterList(
            connector=FilterConnector.AND,
            filters=[{'column_name': 'a',
                      'operator': FilterOperators.equal, 'value': VALUE}],
        )
        reader.filter(filters)
        df_readed: pd.DataFrame = reader.read()

        self.assertEqual(
            df_readed.shape[0], 1,
            'Should select only rows with given value'
        )
        self.assertTrue(
            df_readed.iloc[0]['a'] == VALUE,
            'Should select only rows with given value'
        )

    def test_filtering_operator_greater(self):
        reader: AWSDatasetReader = AWSTestDatasetReader(
            path='mock',
            config=self._preprare_config_mock()
        )
        VALUE: int = 10
        filters = FilterList(
            connector=FilterConnector.AND,
            filters=[{'column_name': 'a',
                      'operator': FilterOperators.greater, 'value': VALUE}],
        )
        reader.filter(filters)
        df_readed: pd.DataFrame = reader.read()

        self.assertTrue(
            (df_readed['a'] > VALUE).all(),
            'Should select only rows with column value greater than given value'
        )

    def test_filtering_operator_is_in(self):
        reader: AWSDatasetReader = AWSTestDatasetReader(
            path='mock',
            config=self._preprare_config_mock()
        )
        VALUE: List[int] = [10, 20, 30]
        filters = FilterList(
            connector=FilterConnector.AND,
            filters=[
                {'column_name': 'a', 'operator': FilterOperators.is_in, 'value': [10, 20, 30]}],
        )
        reader.filter(filters)
        df_readed: pd.DataFrame = reader.read()

        self.assertTrue(
            np.equal(df_readed['a'].values, np.array(VALUE)).all(),
            'Should select only rows with column value int given values set'
        )

    def test_complex_filtering(self):
        reader: AWSDatasetReader = AWSTestDatasetReader(
            path='mock',
            config=self._preprare_config_mock()
        )
        filters1 = FilterList(
            connector=FilterConnector.AND,
            filters=[
                FilterInfo(column_name="a",
                           operator=FilterOperators.greater, value=10),
                FilterInfo(column_name="a",
                           operator=FilterOperators.lower_equal, value=20),
            ],
        )
        filters2 = FilterList(
            connector=FilterConnector.AND,
            filters=[FilterInfo(
                column_name="b", operator=FilterOperators.greater_equal, value=150)],
        )
        filters = FilterList(
            connector=FilterConnector.OR,
            filters=[filters1, filters2]
        )
        reader.filter(filters)
        df = reader.read()
        self.assertEqual(df.shape[0], 60)

    def test_limiting(self):
        reader: AWSDatasetReader = AWSTestDatasetReader(
            path='mock',
            config=self._preprare_config_mock()
        )
        LIMIT = 10
        OFFSET = 20
        reader.limit(limit=LIMIT, offset=OFFSET)
        df_readed: pd.DataFrame = reader.read()

        self.assertListEqual(
            df_readed['a'].values.tolist(),
            list(range(OFFSET, OFFSET + LIMIT)),
            'Should select only rows with column value int given values set'
        )


if __name__ == '__main__':
    unittest.main()
