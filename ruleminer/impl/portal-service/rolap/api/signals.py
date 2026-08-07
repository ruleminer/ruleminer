import os
import paramiko
from typing import Type, Iterable
import logging

from django.db.models.signals import post_save
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.utils import timezone
from django.conf import settings
from django.db.models import Q

from .models import CrossValidationResult
from .models import Dataset
from .models import Report
from .models import Ruleset
from .models import Project


logger = logging.getLogger(__name__)


@receiver(post_save, sender=Dataset)
def update_project_updated_at(sender: Type[Dataset], instance: Dataset, **kwargs):
    """Signal that sets the "updated_at" attribute of the project associated with the saved dataset,
       after the dataset has been saved (changed).

    Args:
        sender (Type[Dataset]): the model class that sends the signal (in this case, Dataset).
        instance (Dataset): the saved Dataset object.
    """

    instance.project.updated_at = timezone.now()
    instance.project.save()


@receiver(pre_delete, sender=Ruleset)
@receiver(pre_delete, sender=Report)
@receiver(pre_delete, sender=CrossValidationResult)
def detach_task(sender, instance, **kwargs):
    task = instance.celery_task.first()
    if task:
        task.result_object = None
        task.save()


def delete_reports_from_sftp_and_nullify_storage_path(reports: Iterable[Report]):
    """
    Helper function to delete report files from SFTP and set storage_path to null.
    """
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
                for report in reports:
                    if not report.storage_path:
                        continue
                    try:
                        sftp.remove(report.storage_path)
                    except FileNotFoundError:
                        pass
                    report.storage_path = None
                    report.save(update_fields=["storage_path"])
    except Exception as e:
        logger.error(f"Failed to delete report files from SFTP: {e}")


@receiver(pre_delete, sender=Dataset)
def dataset_pre_delete_handler(sender, instance, **kwargs):
    """
    Signal handler for Dataset model to delete associated report files from SFTP
    and set storage_path to null before the dataset is deleted.
    """
    reports = Report.objects.filter(
        content_type__model="dataset", object_id=instance.id, storage_path__isnull=False)
    delete_reports_from_sftp_and_nullify_storage_path(reports)

    instance.delete_data()


@receiver(pre_delete, sender=Project)
def project_pre_delete_handler(sender, instance, **kwargs):
    """
    Signal handler for Project model to delete associated report files from SFTP
    and set storage_path to null before the project is deleted.
    """

    reports = Report.objects.filter(
        content_type__model="dataset",
        object_id__in=instance.datasets.values_list("id", flat=True),
        storage_path__isnull=False
    )
    delete_reports_from_sftp_and_nullify_storage_path(reports)
