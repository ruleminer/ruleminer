from django.http import HttpRequest
from django.http import HttpResponse
from injector import inject
from keycloak import KeycloakOpenID
from keycloak import KeycloakPostError
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.views import APIView

from .keycloak_factory import KeycloakServiceFactory
from .serializers import LogoutPayloadSerializer


class LogoutView(APIView):
    """Logout view
    """
    class _CustomSchema(AutoSchema):
        def get_request_serializer(self, path, method):
            return LogoutPayloadSerializer()

        def get_response_serializer(self, path, method):
            return {}

        def get_responses(self, path, method):
            return {
                '200': {
                    'description': 'Logout successful'
                }
            }

    schema = _CustomSchema()

    def __init__(self):
        super().__init__()
        self.keycloak_openid: KeycloakOpenID = None

    @inject
    def setup(self, request, keycloak_factory: KeycloakServiceFactory, *args, **kwargs):  # pylint: disable=arguments-differ
        super().setup(request, *args, **kwargs)
        self.keycloak_openid: KeycloakOpenID = keycloak_factory.make()

    def _logout_from_keycloak(self, refresh_token: str) -> None:
        try:
            self.keycloak_openid.logout(refresh_token)
            return Response(status=status.HTTP_200_OK)
        except KeycloakPostError:
            return Response(
                {'detail': 'Invalid refresh token'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def post(self, request: HttpRequest) -> HttpResponse:
        """Logout user, deactivating his refresh token.

        Args:
            request (HttpRequest):

        Returns:
            HttpResponse:
        """
        data = JSONParser().parse(request)
        serializer = LogoutPayloadSerializer(data=data)
        if serializer.is_valid():
            return self._logout_from_keycloak(serializer.data['refresh_token'])
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
