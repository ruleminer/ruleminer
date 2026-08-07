# pylint: disable=missing-module-docstring,missing-class-docstring,missing-function-docstring
import os
import unittest

import numpy as np
import pandas as pd
import s3fs
from rolap_data_storage.implementations.aws import AWSDatasetReader
from rolap_data_storage.implementations.aws import AWSDatasetWriter
from rolap_data_storage.implementations.aws import AWSStorage
from rolap_data_storage.implementations.aws import AWSStorageConfig


def read_dataset_from_resources(dataset_name: str) -> pd.DataFrame:
    dir_path: str = os.path.dirname(os.path.realpath(__file__))
    return pd.read_csv(
        os.path.join(dir_path, '..', 'resources', f'{dataset_name}.csv')
    )


@unittest.skip('AWS storage implementation is deprecated and no longer in use.')
class TestAWSStorage(unittest.TestCase):

    def _prepare_config(self) -> AWSStorageConfig:
        return AWSStorageConfig(**{
            'endpoint_url': 'http://127.0.0.1:8333',
            'aws_access_key_id': 'rolap-portal-4CeTUr1ZzC',
            'aws_secret_access_key': 'CHANGE_ME'
        })

    def test_dataset_writing(self):
        try:
            df: pd.DataFrame = read_dataset_from_resources('anneal')
            path: str = 'test-upload/anneal.parquet'
            storage = AWSStorage(config=self._prepare_config())
            writer: AWSDatasetWriter = storage.get_dataset_writer(path)
            writer.write(df)

            reader: AWSDatasetReader = storage.get_dataset_reader(path)
            df2 = reader.read()
            self.assertTrue(
                np.equal(df.shape, df2.shape).all(),
                'Dataset fetched from storage should have the same shape as the original one'
            )
            self.assertListEqual(
                df.columns.tolist(),
                df2.columns.tolist(),
                'Dataset fetched from storage should have the same columns as the original one'
            )

        finally:
            file_system = s3fs.S3FileSystem(
                endpoint_url=storage._config.endpoint_url,
                key=storage._config.aws_access_key_id,
                secret=storage._config.aws_secret_access_key
            )
            file_system.rm('s3://test-upload/anneal.gzip')


if __name__ == '__main__':
    unittest.main()
