"""
Settings for running backend on local machine without containerization with other services
running as containers on local machine.
"""
# fmt: off
import os

from dotenv import load_dotenv
# load env variables directly from .env file
dir_path = os.path.dirname(os.path.realpath(__file__))
load_dotenv(os.path.join(dir_path, '..', '..', '..', '.env.local'))
from .common import *  # pylint: disable=wildcard-import,unused-wildcard-import

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['REST_API_DB_NAME'],
        'USER': os.environ['REST_API_DB_USER'],
        'PASSWORD': os.environ['REST_API_DB_PASSWORD'],
        'HOST': os.environ['REST_API_DB_HOST'],
        'PORT': os.environ['REST_API_DB_PORT']
    }
}

VERSION_FILE_PATH: str = os.path.join(dir_path, '..', '..', '..', 'VERSION.txt')
