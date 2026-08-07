from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class BugReport(models.Model):
    """User bug report model
    """
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bug_reports'
    )
    created = models.DateTimeField(auto_now=True)
    description = models.TextField(null=False, blank=False, max_length=3000)
    screenshot = models.FileField(blank=True, null=True)
    allow_contact = models.BooleanField(default=False)
