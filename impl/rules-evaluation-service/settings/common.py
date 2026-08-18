import os

import ecs_logging


STORAGE_PARAMS = {
    "user": os.environ["STORAGE_DB_USER"],
    "password": os.environ["STORAGE_DB_PASSWORD"],
    "db_name": os.environ["STORAGE_DB_NAME"],
    "host": os.environ["STORAGE_DB_HOST"],
    "port": os.environ["STORAGE_DB_PORT"],
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
        'rules_evaluation_service': {
            'handlers': ['logger'],
            'level': 'INFO',
            'propagate': True
        }
    }
}

ROUND_DECIMAL_PLACES = int(os.environ["ROUND_DECIMAL_PLACES"])
