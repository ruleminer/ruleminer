# pylint: disable=C0116,C0115
import json
from datetime import datetime
from typing import Dict
from unittest.mock import MagicMock

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.http import HttpRequest
from django.test import override_settings
from django.test import TestCase
from django.test.client import RequestFactory
from django.urls import reverse
from keycloak import KeycloakOpenID
from keycloak_auth.backend import KeycloakAuthBackend
from keycloak_auth.keycloak_factory import KeycloakServiceFactory
from keycloak_auth.models import User
from keycloak_auth.views import LogoutView
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed

def generate_test_key_pair() -> tuple[str, str]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.PKCS1,
    ).decode()
    public_body = ''.join(public_pem.strip().splitlines()[1:-1])
    return private_pem, public_body


PRIVATE_KEY, PUBLIC_KEY = generate_test_key_pair()


class KeycloakAuthTests(TestCase):

    KEYCLOAK_TEST_CONFIG: Dict = {
        'KEYCLOAK_URL': 'test',
        'REALM': 'test',
        'CLIENT_ID': 'test',
        'CLIENT_SECRET': 'test',
    }

    def setUp(self):
        User.objects.all().delete()
        self.invalid_private_key, _ = generate_test_key_pair()
        self.test_user_keycloak_id: str = 'test_user_keycloak_id'
        self.test_username: str = 'test_user'
        self.test_email: str = 'test@test.com'
        self.test_firstname: str = 'test_firstname'
        self.test_lastname: str = 'test_lastname'
        keycloak_openid: KeycloakOpenID = KeycloakServiceFactory().make()
        keycloak_openid.public_key = MagicMock(return_value=PUBLIC_KEY)
        KeycloakServiceFactory.make = MagicMock(return_value=keycloak_openid)
        self.keycloak_auth = KeycloakAuthBackend()

    def tearDown(self) -> None:
        User.objects.all().delete()

    def _generate_test_token(
        self,
        private_key: str,
        expired: bool = False
    ) -> str:
        token = {
            'exp': datetime.now().timestamp() + 60 * 10,
            'iat': 1682325201,
            'jti': '2105f8c4-659d-4dc9-b83f-a7a944ca18a4',
            'iss': 'http://localhost:8080/auth/realms/ROLAP',
            'aud': 'account',
            'sub': self.test_user_keycloak_id,
            'typ': 'Bearer',
            'azp': 'rolap-web',
            'session_state': 'c1b9c90f-cb1e-4f22-9c8a-9a8f5b47e4ed',
            'acr': '1',
            'allowed-origins': ['*'],
            'realm_access': {
                'roles': [
                    'test_permission'
                ]
            },
            'resource_access': {},
            'scope': 'openid profile email',
            'sid': 'c1b9c90f-cb1e-4f22-9c8a-9a8f5b47e4ed',
            'email_verified': True,
            'name': f'{self.test_firstname} {self.test_lastname}',
            'preferred_username': self.test_username,
            'given_name': self.test_firstname,
            'family_name': self.test_lastname,
            'email': self.test_email
        }
        token['exp'] = datetime.now().timestamp()
        token['exp'] += -600 if expired else 600
        return jwt.encode(token, private_key, algorithm="RS256")

    @override_settings(KEYCLOAK=KEYCLOAK_TEST_CONFIG)
    def test_auth_with_valid_token(self):
        test_token: str = self._generate_test_token(PRIVATE_KEY)
        keycloak_openid: KeycloakOpenID = KeycloakServiceFactory.make()
        keycloak_openid.public_key = MagicMock(return_value=PUBLIC_KEY)
        keycloak_openid.userinfo = MagicMock(return_value={
            'sub': self.test_user_keycloak_id,
            'email_verified': True,
            'name': f'{self.test_firstname} {self.test_lastname}',
            'preferred_username': self.test_username,
            'given_name': self.test_firstname,
            'family_name': self.test_lastname,
            'email': self.test_email
        })
        KeycloakServiceFactory.make = MagicMock(return_value=keycloak_openid)
        keycloak_auth = KeycloakAuthBackend()
        request = RequestFactory().get(
            reverse('logout'),
            HTTP_Authorization=f'Bearer {test_token}'
        )

        user: User = keycloak_auth.authenticate(request)[0]

        self.assertIsNotNone(user, 'Should return user object for valid token')
        self.assertEqual(
            user.username,
            self.test_username,
            "Created user should have username taken from token"
        )
        self.assertEqual(
            user.first_name,
            self.test_firstname,
            "Created user should have first name taken from token"
        )
        self.assertEqual(
            user.last_name,
            self.test_lastname,
            "Created user should have last name taken from token"
        )
        self.assertEqual(
            user.email,
            self.test_email,
            "Created user should have email taken from token"
        )
        self.assertTrue(
            user.is_active,
            "Created user should be active"
        )
        self.assertEqual(
            user.keycloak_id,
            self.test_user_keycloak_id,
            "Created user should have keycloak id taken from token"
        )
        self.assertEqual(
            User.objects.count(),
            1,
            'Should create record for new authenticated user'
        )
        self.assertTrue(
            user.has_perm('test_permission') and not user.has_perm(
                'invalid_permission'),
            'User permissions should be extracted from token and mapped to user object'
        )
        self.assertTrue(
            user.has_perms(['test_permission']) and not user.has_perms(
                ['invalid_permission']),
            'User permissions should be extracted from token and mapped to user object'
        )

    @override_settings(KEYCLOAK=KEYCLOAK_TEST_CONFIG)
    def test_auth_with_invalid_token(self):
        test_token: str = self._generate_test_token(self.invalid_private_key)
        request: HttpRequest = RequestFactory().get(
            reverse('logout'),
            HTTP_Authorization=f'Bearer {test_token}'
        )
        with self.assertRaises(AuthenticationFailed):
            self.keycloak_auth.authenticate(request)

    @override_settings(KEYCLOAK=KEYCLOAK_TEST_CONFIG)
    def test_auth_with_expired_token(self):
        test_token: str = self._generate_test_token(PRIVATE_KEY, expired=True)
        request: HttpRequest = RequestFactory().get(
            reverse('logout'),
            HTTP_Authorization=f'Bearer {test_token}'
        )
        with self.assertRaises(AuthenticationFailed):
            self.keycloak_auth.authenticate(request)

    @override_settings(KEYCLOAK=KEYCLOAK_TEST_CONFIG)
    def test_request_without_token(self):
        keycloak_openid: KeycloakOpenID = KeycloakServiceFactory().make()
        keycloak_openid.public_key = MagicMock(return_value=PUBLIC_KEY)
        KeycloakServiceFactory.make = MagicMock(return_value=keycloak_openid)
        keycloak_auth = KeycloakAuthBackend()
        request: HttpRequest = RequestFactory().get(reverse('logout'))

        auth_result = keycloak_auth.authenticate(request)
        self.assertIsNone(
            auth_result,
            "Authentication result should be `None` if no token was present in headers"
        )


class LogoutTests(TestCase):

    def test_logout(self):
        request: HttpRequest = RequestFactory().post(
            reverse('logout'),
            data=json.dumps({
                'refresh_token': 'test_refresh_token'
            }),
            content_type='application/json',
            HTTP_Authorization='Bearer test_token'
        )
        keycloak_factory = KeycloakServiceFactory()
        keycloak_openid: KeycloakOpenID = keycloak_factory.make()
        keycloak_openid.logout = MagicMock()
        keycloak_factory.make = MagicMock(return_value=keycloak_openid)
        view = LogoutView()
        view.setup(request, keycloak_factory)

        response = view.post(request)
        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            'Should return 200'
        )
        try:
            keycloak_openid.logout.assert_called()
        except AssertionError:
            self.fail('Keycloak logout should be called for valid token')
