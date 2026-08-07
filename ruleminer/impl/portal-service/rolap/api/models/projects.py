from typing import List
from typing import Tuple

from django.db import models
from django.db import transaction
from django.utils import timezone
from keycloak_auth.models import User


class Project(models.Model):
    class Meta:
        unique_together = ("owner", "name")
    CLASSIFICATION: str = 'classification'
    REGRESSION: str = 'regression'
    SURVIVAL: str = 'survival'
    TYPE_OF_PROBLEM_CHOICES: List[Tuple[str, str]] = [
        (CLASSIFICATION, 'Classification'),
        (REGRESSION, 'Regression'),
        (SURVIVAL, 'Survival'),
    ]

    name: models.CharField = models.CharField(max_length=50)
    description: models.CharField = models.TextField(blank=True, null=True)
    type_of_problem: models.CharField = models.CharField(
        max_length=20, choices=TYPE_OF_PROBLEM_CHOICES, default=CLASSIFICATION)
    created_at: models.DateTimeField = models.DateTimeField(
        default=timezone.now, editable=False)
    updated_at: models.DateTimeField = models.DateTimeField(
        default=timezone.now)
    last_opened_at: models.DateTimeField = models.DateTimeField(
        default=timezone.now)
    owner: models.ForeignKey = models.ForeignKey(
        User, null=False, on_delete=models.CASCADE, related_name='projects')

    def __str__(self):
        return self.name

    def delete(self, using=None, keep_parents=False):
        with transaction.atomic():
            for dataset in self.datasets.all():
                dataset.delete()
            super().delete(using=using, keep_parents=keep_parents)

    @property
    def dataset_count(self):
        return self.datasets.count()
