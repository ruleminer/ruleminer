import logging
from typing import Optional
from typing import Tuple
from typing import TypedDict

import jose
from django.conf import settings
from django.http import HttpRequest
from keycloak import KeycloakAuthenticationError
from keycloak import KeycloakOpenID
from keycloak import KeycloakAdmin
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

from .keycloak_factory import KeycloakServiceFactory
from .models import User


class _KeycloakUserResponse(TypedDict):
    sub: str
    email_verified: bool
    name: str
    preferred_username: str
    given_name: str
    family_name: str
    email: str


class _DecodedToken(TypedDict):
    exp: int
    realm_access: dict
    resource_access: dict
    scope: str
    sub: str
    preferred_username: str
    name: str
    email_verified: bool
    given_name: str
    family_name: str
    email: str


class KeycloakAuthBackend(authentication.BaseAuthentication):
    """Keycloak Authentication backend, for offline validation of user's
    access tokens using RSA public keys. It automatically creates local user
    instance in database on the user's first authorized access.

    Raises:
        AuthenticationFailed:
    """

    INVALID_TOKEN_MESSAGE = 'Invalid auth token'
    AUTH_HEADER_KEY: str = 'Authorization'
    AUTH_HEADER_PREFIX: str = 'Bearer'
    KEYCLOAK_USER_ID_FIELD: str = 'sub'

    def __init__(self):
        self._keycloak_openid: KeycloakOpenID = KeycloakServiceFactory.make()
        self._public_key: str = ''.join([
            "-----BEGIN RSA PUBLIC KEY-----\n",
            self._keycloak_openid.public_key(),
            "\n-----END RSA PUBLIC KEY-----",
        ])

    def authenticate(self, request: HttpRequest) -> Optional[Tuple[User, None]]:
        access_token: Optional[str] = self._get_token(request)
        if access_token is None:
            return None
        try:
            user: User = self._get_or_create_user(access_token)
            return user, None
        except KeycloakAuthenticationError as error:
            raise AuthenticationFailed(
                self.INVALID_TOKEN_MESSAGE
            ) from error

    def authenticate_header(self, request):
        return self.AUTH_HEADER_PREFIX

    def _get_token(self, request: HttpRequest) -> Optional[str]:
        auth_header: str = request.headers.get(self.AUTH_HEADER_KEY)
        if auth_header is not None and self.AUTH_HEADER_PREFIX in auth_header:
            return auth_header.replace(self.AUTH_HEADER_PREFIX, '').strip()
        return None

    def _get_or_create_user(self, access_token: str) -> User:
        decoded_token: _DecodedToken = self._decode_token(access_token)
        keycloak_user_id: str = decoded_token.get(
            self.KEYCLOAK_USER_ID_FIELD, "")
        try:
            user: User = User.objects.get(keycloak_id=keycloak_user_id)
        except User.DoesNotExist:
            user: User = self._create_local_user_in_db(access_token)
        self._assign_user_permissions(decoded_token, user)
        return user

    def _decode_token(self, access_token: str) -> _DecodedToken:
        options = {"verify_signature": True, "verify_aud": False, "exp": True}
        try:
            return self._keycloak_openid.decode_token(
                access_token,
                key=self._public_key,
                options=options
            )
        except jose.exceptions.ExpiredSignatureError as error:
            raise AuthenticationFailed(
                'Token expired'
            ) from error
        except jose.exceptions.JWTError as error:
            raise AuthenticationFailed(
                self.INVALID_TOKEN_MESSAGE
            ) from error

    def _create_local_user_in_db(self, access_token: str) -> User:
        # get most recent user data directly from keycloak api
        user_info: _KeycloakUserResponse = self._keycloak_openid.userinfo(
            access_token
        )
        keycloak_user_id: str = user_info['sub']
        # that call to keycloak api might take a while, in this time a different
        # request may manage to create a new user with the same keycloak_user_id
        user, _ = User.objects.get_or_create(
            username=user_info.get('preferred_username', ""),
            email=user_info['email'],
            first_name=user_info.get('given_name', ""),
            last_name=user_info.get('family_name', ""),
            keycloak_id=keycloak_user_id
        )
        return user

    def _assign_user_permissions(self, decoded_token: _DecodedToken, user: User):
        try:
            user._permissions = decoded_token['realm_access']['roles']  # pylint: disable=protected-access
        except KeyError as error:
            logging.getLogger().error(
                'Failed to extract user permissions from token.' +
                'It is likely a keycloak configuration issue.'
            )
            raise AuthenticationFailed(
                self.INVALID_TOKEN_MESSAGE
            ) from error

    def has_perm(self, user: User, perm: str, obj=None) -> bool:  # pylint: disable=unused-argument
        """Check if user has permission.

        Args:
            user (User): user object
            perm (str): permission name
            obj (_type_, optional): unused parameter, failed to find its documentation in Django.
                 Defaults to None.

        Returns:
            bool: true if user has permission
        """
        return perm in user._permissions  # pylint: disable=protected-access

    def delete_user_in_keycloak(self, keycloak_id: str):
        """
        Deletes a user in Keycloak by their Keycloak ID.

        Args:
            keycloak_id (str): The Keycloak ID of the user to delete.

        Raises:
            Exception: If the user could not be deleted.
        """
        keycloak_admin = KeycloakAdmin(
            server_url=settings.KEYCLOAK['KEYCLOAK_URL'],
            username=settings.KEYCLOAK['ADMIN_USERNAME'],
            password=settings.KEYCLOAK['ADMIN_PASSWORD'],
            realm_name="master",
            client_id="admin-cli",
            verify=True
        )
        keycloak_admin.realm_name = settings.KEYCLOAK['REALM']
        keycloak_admin.delete_user(user_id=keycloak_id)
