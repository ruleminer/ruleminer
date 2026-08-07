from django.db import models


class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=255, unique=True)
    payment_link = models.URLField(
        max_length=1024, blank=True, null=True, unique=True)

    def __str__(self):
        return self.name
