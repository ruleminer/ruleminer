from django.db import models
from keycloak_auth.models import User
from rolap.api.models import LimitGroup


class Subscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    limit_group = models.ForeignKey(LimitGroup, on_delete=models.PROTECT)
    # Subscription identifier in Stripe
    subscription_id = models.CharField(
        max_length=255, unique=True, null=True, blank=True)
    start_date = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
