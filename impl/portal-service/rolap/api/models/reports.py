import os

import paramiko
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from rolap.api.exceptions import ReportDeleteException


class Report(models.Model):
    # fields pertaining to relating the report to its corresponding object
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey()

    class ReportType(models.TextChoices):
        EDA = "EDA", "EDA"
        PREDICTION = "PREDICTION", "PREDICTION"
        WHITEBOX = "WHITEBOX", "WHITEBOX"

    # fields pertaining to the report itself
    title = models.CharField(max_length=75)
    storage_path = models.CharField(max_length=256, null=True)
    type = models.CharField(max_length=16, choices=ReportType.choices)
    generation_params = models.JSONField(null=True)
    celery_task = GenericRelation(
        "api.Task",
        content_type_field="result_content_type",
        object_id_field="result_object_id",
    )

    @property
    def owner(self):
        return self.content_object.owner

    class Meta:
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def delete(self, using=None, keep_parents=False):
        """
        Deletes the report and removes the associated file from the SFTP server.
        """
        if self.storage_path:
            try:
                with paramiko.SSHClient() as ssh:
                    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                    ssh.connect(
                        settings.REPORTS_SFTP_HOST,
                        port=settings.REPORTS_SFTP_PORT,
                        username=settings.REPORTS_SFTP_USERNAME,
                        password=settings.REPORTS_SFTP_PASSWORD,
                    )
                    with ssh.open_sftp() as sftp:
                        sftp.remove(self.storage_path)
            except Exception as e:
                raise ReportDeleteException(
                    f"Failed to delete report file from SFTP") from e

        super().delete(using=using, keep_parents=keep_parents)
