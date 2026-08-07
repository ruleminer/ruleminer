import pandas as pd
from rolap_data_storage.abstract import AbstractDatasetWriter
from rolap_data_storage.implementations.aws.config import AWSStorageConfig


class AWSDatasetWriter(AbstractDatasetWriter):

    def __init__(self, path: str, config: AWSStorageConfig) -> None:
        super().__init__(path)
        self._config: AWSStorageConfig = config

    def write(self, df: pd.DataFrame) -> None:
        df.to_parquet(
            f"s3://{self._path}",
            storage_options={
                'key': self._config.aws_access_key_id,
                'secret': self._config.aws_secret_access_key,
                'client_kwargs': {
                    'endpoint_url': self._config.endpoint_url
                }
            },
        )
