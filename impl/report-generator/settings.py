import os

import ecs_logging
from dotenv import load_dotenv
# load env variables directly from .env file
dir_path = os.path.dirname(os.path.realpath(__file__))
loaded = load_dotenv(os.path.join(dir_path, '..', '..', '..', '.env.local'))

CELERY_BROKER_URL = os.environ["CELERY_BROKER_URL"]
CELERY_TASK_DEFAULT_EXCHANGE = os.environ["CELERY_TASK_DEFAULT_EXCHANGE"]
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_QUEUES = {
    os.environ["REPORT_TASK_QUEUE_NAME"]: {
        "binding_key": os.environ["REPORT_TASK_QUEUE_KEY"],
    }
}

STORAGE_PARAMS = {
    "user": os.environ["STORAGE_DB_USER"],
    "password": os.environ["STORAGE_DB_PASSWORD"],
    "db_name": os.environ["STORAGE_DB_NAME"],
    "host": os.environ["STORAGE_DB_HOST"],
    "port": os.environ["STORAGE_DB_PORT"],
}

ACCESS_TOKEN_CREDENTIALS = {
    'grant_type': 'password',
    'client_id': os.environ["WORKER_KEYCLOAK_CLIENT_ID"],
    'username': os.environ["WORKER_KEYCLOAK_USERNAME"],
    'password': os.environ["WORKER_KEYCLOAK_PASSWORD"],
    'scope': os.environ["WORKER_KEYCLOAK_SCOPE"]
}
if os.environ.get("WORKER_KEYCLOAK_CLIENT_SECRET"):
    ACCESS_TOKEN_CREDENTIALS['client_secret'] = os.environ[
        "WORKER_KEYCLOAK_CLIENT_SECRET"
    ]

ACCESS_TOKEN_ENDPOINT = {
    'url_base_path': f'{os.environ["WORKER_KEYCLOAK_URL"]}',
    'access_token_endpoint': f'/auth/realms/{os.environ["KEYCLOAK_REALM"]}/protocol/openid-connect/token',
}

LOGS_DIR = os.path.join(os.getcwd(), "logs")

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'elasticsearch': {
            '()': ecs_logging.StdlibFormatter,
        },
    },
    'handlers': {
        'logger': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(LOGS_DIR, 'log.log'),
            'maxBytes': 15728640,  # 1024 * 1024 * 15B = 15MB
            'backupCount': 10,
            'formatter': 'elasticsearch',
        }
    },
    'loggers': {
        'report_generator': {
            'handlers': ['logger'],
            'level': 'INFO',
            'propagate': True
        },
    }
}

# Reports SFTP server credentials
REPORTS_SFTP_HOST = os.environ["REPORTS_SFTP_HOST"]
REPORTS_SFTP_PORT = int(os.environ["REPORTS_SFTP_PORT"])
REPORTS_SFTP_USERNAME = os.environ["REPORTS_SFTP_USERNAME"]
REPORTS_SFTP_PASSWORD = os.environ["REPORTS_SFTP_PASSWORD"]
