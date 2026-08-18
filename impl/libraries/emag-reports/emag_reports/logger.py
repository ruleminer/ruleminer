import logging
import os
from logging.config import dictConfig

import ecs_logging


logging.getLogger('matplotlib.font_manager').setLevel(level=logging.CRITICAL)

LOGS_DIR = os.path.join(os.getcwd(), "logs")

if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

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
            'filename': os.path.join(LOGS_DIR, 'emag_reports.log'),
            'maxBytes': 15728640,  # 1024 * 1024 * 15B = 15MB
            'backupCount': 10,
            'formatter': 'elasticsearch',
        }
    },
    'loggers': {
        'emag_reports': {
            'handlers': ['logger'],
            'level': 'INFO',
            'propagate': False,
        }
    }
}

dictConfig(LOGGING)

logger = logging.getLogger("emag_reports")
