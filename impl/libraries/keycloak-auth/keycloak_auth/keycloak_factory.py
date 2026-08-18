from django.conf import settings
from keycloak import KeycloakOpenID


class KeycloakServiceFactory:
    """Factory class for keycloak client service
    """

    @staticmethod
    def make() -> KeycloakOpenID:
        """
        Returns:
            KeycloakOpenID: keycloak client service
        """
        return KeycloakOpenID(
            server_url=settings.KEYCLOAK['KEYCLOAK_URL'],
            realm_name=settings.KEYCLOAK['REALM'],
            client_id=settings.KEYCLOAK['CLIENT_ID'],
            client_secret_key=settings.KEYCLOAK['CLIENT_SECRET']
        )
