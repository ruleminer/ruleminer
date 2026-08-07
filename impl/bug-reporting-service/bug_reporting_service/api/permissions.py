from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView


class IsRolapUser(IsAuthenticated):
    def has_permission(self, request: Request, view: APIView):
        return (
            super().has_permission(request, view) and
            request.user.has_perm(settings.KEYCLOAK_USER_ROLE)
        )


class IsRolapOperator(IsAuthenticated):
    def has_permission(self, request: Request, view: APIView):
        return (
            super().has_permission(request, view) and
            request.user.has_perm(settings.KEYCLOAK_OPERATOR_ROLE)
        )
