import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rolap.settings.common")

app = Celery("rolap")
app.config_from_object("django.conf:settings", namespace="CELERY")
