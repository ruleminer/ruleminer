"""Models for app tours. Tours are tutorials that guides users through the app.
"""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Tour(models.Model):
    name = models.CharField(
        max_length=255, unique=True,
        db_index=True, blank=False, null=False
    )


class CompletedTour(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tour = models.ForeignKey(Tour, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'tour')
