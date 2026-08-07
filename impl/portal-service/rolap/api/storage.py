from django.conf import settings
from rolap_data_storage.implementations.sql import DBStorage
from rolap_data_storage.implementations.sql import DBStorageConfig


def _get_storage():
    """Creates storage object hiding its implementation.

    Raises:
        ValueError: If storage is not configured in settings file

    Returns:
        DBStorage: Storage object instance
    """
    try:
        storage_config: dict = settings.STORAGE_CONFIG
    except AttributeError:
        raise ValueError(
            'Storage is not configured. Settings file should contain ' +
            f'"STORAGE_CONFIG" variable containing dictionary with valid ' +
            'storage configuration.'
        )
    return DBStorage(DBStorageConfig(**storage_config), pool_size=4, max_overflow=1, pool_timeout=120)


storage = _get_storage()
