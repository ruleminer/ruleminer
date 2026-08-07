import os
from unittest.mock import patch

from django.test.runner import DiscoverRunner
from rolap_data_storage.implementations.sql import DBStorage
from rolap_data_storage.implementations.sql import DBStorageConfig
from sqlalchemy import create_engine
from sqlalchemy import text

TEST_STORAGE_CONFIG = {
    "user": os.environ["STORAGE_DB_USER"],
    "password": os.environ["STORAGE_DB_PASSWORD"],
    "db_name": "test",
    "host": os.environ["STORAGE_DB_HOST"],
    "port": os.environ["STORAGE_DB_PORT"],
}


class APITestRunner(DiscoverRunner):
    PUBLIC_KEY: str = '\n'.join([
        'MEgCQQDFFfVv4g8K9+48zhT8SkeFYQ6tU69Vc0pOoBWuyqumrH/vbkkAQc+tkEWb',
        'ADoIypZWqENBKIBgdjpDhbFGOcGzAgMBAAE=',
    ])

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.test_config = DBStorageConfig(**TEST_STORAGE_CONFIG)
        self.test_url = f"postgresql+psycopg://{self.test_config.user}:{self.test_config.password}@{self.test_config.host}:{self.test_config.port}"

    def setup_databases(self, **kwargs):
        # create separate storage database for testing
        engine = create_engine(self.test_url)
        with engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT").execute(
                text("DROP DATABASE IF EXISTS test WITH (FORCE);"))
            conn.execute(
                text("CREATE DATABASE test;"))
        return super().setup_databases(**kwargs)

    def teardown_databases(self, old_config, **kwargs):
        # teardown test storage database
        engine = create_engine(self.test_url)
        with engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT").execute(
                text("DROP DATABASE IF EXISTS test WITH (FORCE);"))
        return super().teardown_databases(old_config, **kwargs)

    def run_tests(self, test_labels, **kwargs):
        # use context managers to
        # 1. override storage with test config
        # 2. mock keycloak
        # 3. mock sending tasks to workers
        test_storage = DBStorage(self.test_config)
        with (patch("rolap.api.models.datasets.datasets.storage", new=test_storage),
              patch("keycloak_auth.keycloak_factory.KeycloakOpenID") as mock_keycloak,
              patch("rolap.celery.app.send_task", return_value=1)):
            mock_keycloak.return_value.public_key.return_value = self.PUBLIC_KEY
            return super().run_tests(test_labels, **kwargs)
