from rolap_data_storage.implementations.sql import DBStorage
from rolap_data_storage.implementations.sql import DBStorageConfig
from settings.common import STORAGE_PARAMS

storage = DBStorage(DBStorageConfig(**STORAGE_PARAMS),
                    pool_size=2, max_overflow=1, pool_timeout=600)
