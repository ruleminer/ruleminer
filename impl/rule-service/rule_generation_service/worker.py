import logging
from logging.config import dictConfig

from celery import Celery
from celery.signals import setup_logging
from celery.signals import task_failure
from exceptions import BaseRuleServiceException
from settings.celery import CELERY_ACCEPT_CONTENT
from settings.celery import CELERY_BROKER_URL
from settings.celery import CELERY_TASK_DEFAULT_EXCHANGE
from settings.celery import CELERY_TASK_QUEUES
from settings.common import LOGGING

app = Celery("rule_service", include=["tasks", "backend", ])


@setup_logging.connect
def config_loggers(*_args, **_kwargs):
    dictConfig(LOGGING)


@task_failure.connect
def custom_error_handler(sender, task_id, exception, args, kwargs, traceback, einfo, **kw):
    celery_logger = logging.getLogger("rule_generation_service")
    celery_logger.log(
        logging.INFO, "===================== HANDLING ERROR =====================")

    # We log the task ID, original exception if any, and the exception that was raised
    celery_logger.info(f"Task {task_id} failed!")
    if isinstance(exception, BaseRuleServiceException):
        celery_logger.exception(exception.cause, exc_info=True)
    celery_logger.exception(exception, exc_info=True)

    celery_logger.propagate = True


app.conf.update(
    broker_url=CELERY_BROKER_URL,
    task_default_exchange=CELERY_TASK_DEFAULT_EXCHANGE,
    accept_content=CELERY_ACCEPT_CONTENT,
    task_queues=CELERY_TASK_QUEUES,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1,
    task_track_started=True,
    task_error_whitelist=('*',),
    result_backend="backend:RolapHTTPQueueBackend",
    result_backend_always_retry=True,
)

app.autodiscover_tasks()

if __name__ == '__main__':
    print("run ========================================================")
    app.worker_main(["worker", "--loglevel=INFO"])
