import os

from dotenv import load_dotenv
# load env variables directly from .env file
dir_path = os.path.dirname(os.path.realpath(__file__))
loaded = load_dotenv(os.path.join(dir_path, '..', '..', '..', '.env.local'))

os.environ["DJANGO_SETTINGS_MODULE"] = ""

CELERY_BROKER_URL = os.environ["CELERY_BROKER_URL"]
CELERY_TASK_DEFAULT_EXCHANGE = os.environ["CELERY_TASK_DEFAULT_EXCHANGE"]
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_QUEUES = {
    os.environ["CELERY_TASK_QUEUE_NAME"]: {
        "binding_key": os.environ["CELERY_TASK_QUEUE_KEY"],
    }
}
