from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user class adding keycloak user id field
    """
    id = models.AutoField(primary_key=True)
    keycloak_id = models.CharField(
        max_length=36, blank=True, null=False, unique=True
    )
    create_date = models.DateTimeField(auto_now=True)
    preferred_language = models.CharField(max_length=10, blank=True, null=True, choices=[
                                          ('pl', 'Polish'), ('en', 'English')])

    _permissions: list[str] = []
