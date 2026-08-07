from enum import Enum

from celery import states
from celery.contrib.abortable import ABORTED
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone


class TaskType(str, Enum):
    LEARNING = "learning"
    CROSS_VALIDATION = "cross-validation"
    SAVE_RULESET = "save-ruleset"
    FILTER_RULESET = "filter-ruleset"
    REPORT = "report"


class Task(models.Model):
    class TaskStatus(models.TextChoices):
        STARTED = states.STARTED
        SUCCESS = states.SUCCESS
        FAILURE = states.FAILURE
        PENDING = states.PENDING
        ABORTED = ABORTED
        STOPPING = "STOPPING"
        STOPPED = "STOPPED"

    project = models.ForeignKey(
        "api.Project", on_delete=models.CASCADE, related_name="tasks", null=True)
    task_id = models.AutoField(primary_key=True)
    inner_id = models.PositiveIntegerField(null=True)
    create_timestamp = models.DateTimeField(default=timezone.now)
    start_timestamp = models.DateTimeField(null=True)
    finish_timestamp = models.DateTimeField(null=True)
    status = models.CharField(max_length=8, choices=TaskStatus.choices)
    error_cause = models.TextField(default="", blank=True)
    type = models.CharField(max_length=100)
    meta = models.JSONField()

    # source object fields
    source_content_type = models.ForeignKey(
        ContentType, on_delete=models.SET_NULL, null=True, related_name="tasks_as_source")
    source_object_id = models.PositiveIntegerField(null=True)
    source_object = GenericForeignKey(
        "source_content_type", "source_object_id")

    # result object fields
    result_content_type = models.ForeignKey(
        ContentType, on_delete=models.SET_NULL, null=True, related_name="tasks_as_result")
    result_object_id = models.PositiveIntegerField(null=True)
    result_object = GenericForeignKey(
        "result_content_type", "result_object_id")

    class Meta:
        indexes = [
            models.Index(fields=["source_content_type", "source_object_id"]),
            models.Index(fields=["result_content_type", "result_object_id"]),
        ]

    def save(
        self, force_insert=False, force_update=False, using=None, update_fields=None
    ):
        if self._state.adding:
            highest_id = self.project.tasks.aggregate(
                max_id=models.Max("inner_id"))["max_id"]
            self.inner_id = (highest_id or 0) + 1
        super().save(force_insert, force_update, using, update_fields)

    @property
    def owner(self):
        return self.project.owner

    @property
    def execution_time(self):
        if self.start_timestamp is None:
            return 0
        if self.finish_timestamp is not None:
            return (self.finish_timestamp - self.start_timestamp).total_seconds()
        return (timezone.now() - self.start_timestamp).total_seconds()
