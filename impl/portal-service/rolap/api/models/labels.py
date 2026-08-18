from django.db import models
from keycloak_auth.models import User


class Label(models.Model):
    name = models.CharField(max_length=20)
    color = models.CharField(max_length=20)
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='labels')

    class Meta:
        unique_together = ('owner', 'name')

    def __str__(self):
        return self.name
