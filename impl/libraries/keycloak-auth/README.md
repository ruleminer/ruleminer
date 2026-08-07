# Keycloak Auth

Easy Keycloak based authentication in your Django project.

## Quick start

### 1. Add app to your `INSTALLED_APPS` setting like this:
```python
INSTALLED_APPS = [
    ...,
    "keycloak_auth.apps.KeycloakAuthConfig",
]
```

### 2. Add Keycloak authentication backend in your settings.py like this:
```python
AUTHENTICATION_BACKENDS = [
    'keycloak_auth.backend.KeycloakAuthBackend'
]

```

## 3. Add Keycloak authentication backend to your `DEFAULT_AUTHENTICATION_CLASSES` in settings.py: 

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'keycloak_auth.backend.KeycloakAuthBackend',
    ),
   ...
}

```

## 4. Set `AUTH_USER_MODEL` in settings.py:

```python
AUTH_USER_MODEL = "keycloak_auth.User"
```

## 4. Configure Keycloak access in settings.py:
```python
KEYCLOAK = {
    
    'KEYCLOAK_URL': os.environ['KEYCLOAK_URL'], # somethings like this: http://keycloak:8080/auth/
    'REALM': os.environ['KEYCLOAK_REALM'],
    'CLIENT_ID': os.environ['KEYCLOAK_CLIENT_ID'],
    'CLIENT_SECRET': os.environ['KEYCLOAK_CLIENT_SECRET']
}
```

### 3. Run ``python manage.py migrate`` to create the models.

## Tutorials

### Get user from request

Nothing fancy here
```python
class UserInfoView(APIView):

    def get(self, request):
        user = request.user
        ...
        return Response(serializer.data)
```

### Managing user permissions

Keycloak roles could be easily accessed using default django permissions system. Those permission behave pretty much the same as original django ones yet they are not stored in the database. They are dynamically extracted from the user token.

> To be able to access user roles data this data must be present in the user tokens. By default Keycloak tokens does not contain such information. To add it you have to go to **Choose your realm** -> **Client scopes** -> **roles** -> **Mappers** and add **client roles** mapper and set **roles** scope as Default.

```python
from django.conf import settings
from django.db.models import Model
from rest_framework.permissions import BasePermission
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView

KEYCLOAK_SPECIAL_USER_ROLE = "my_special_role"

class IsSpecialUser(IsAuthenticated):
    def has_permission(self, request: Request, view: APIView):
        return (
            super().has_permission(request, view) and 
            request.user.has_perm(KEYCLOAK_SPECIAL_USER_ROLE)
        )
```

then in your view class:

```python
class BooksBaseView(GenericAPIView):
    permission_classes = [IsSpecialUser]
    queryset = Books.objects.all()
    lookup_url_kwarg = "id"

    def get_object(self):
        try:
            return super().get_object()
        except (PermissionDenied, Http404):
            raise BookNotFoundException()
```

### Sign out

Although there is no way to really sign out using JWT, this app provides a simple endpoint (`POST` **/logout**) that invalidates current user refresh token. You still need to delete this token from your application frontend. 

To use this endpoint import app urls like this:

```python
    path("auth/", include("keycloak_auth.urls")),
```

### Testing
Library can be testing within our `rest-api` application container using the `scripts/test.sh` script.
