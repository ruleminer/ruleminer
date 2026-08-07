from django.apps import AppConfig
from django.conf import settings


class KeycloakAuthConfig(AppConfig):
    """Keycloak app configuration
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'keycloak_auth'

    def ready(self) -> None:
        super().ready()
        self._validate_settings()

    def _validate_settings(self):
        if not hasattr(settings, 'KEYCLOAK'):
            raise ValueError(
                'KEYCLOAK configuration object is missing settings'
            )
