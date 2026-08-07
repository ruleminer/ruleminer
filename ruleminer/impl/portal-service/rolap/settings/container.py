"""
Settings for running inside container
"""
from .common import *  # pylint: disable=wildcard-import,


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
