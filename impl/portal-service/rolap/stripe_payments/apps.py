from django.apps import AppConfig
from django.conf import settings


class StripePaymentsConfig(AppConfig):
    """Stripe payment app configuration
    """
    default_auto_field = "django.db.models.BigAutoField"
    name = "rolap.stripe_payments"

    def ready(self) -> None:
        super().ready()
        self._validate_settings()

    def _validate_settings(self):
        if not hasattr(settings, 'STRIPE'):
            raise ValueError(
                'STRIPE configuration object is missing settings'
            )
