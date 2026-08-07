from django.conf import settings
from django.db.models import Model
from rest_framework.permissions import BasePermission
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView


class OwnerPermission(BasePermission):
    def has_object_permission(self, request: Request, view: APIView, obj: Model):
        try:
            return obj.owner == request.user
        except AttributeError:
            return False


class IsRolapUser(IsAuthenticated):
    def has_permission(self, request: Request, view: APIView):
        return super().has_permission(request, view) and request.user.has_perm(settings.KEYCLOAK_USER_ROLE)


class IsRolapOperator(IsAuthenticated):
    def has_permission(self, request: Request, view: APIView):
        return super().has_permission(request, view) and request.user.has_perm(settings.KEYCLOAK_OPERATOR_ROLE)


class IsCeleryWorker(IsAuthenticated):
    def has_permission(self, request: Request, view: APIView):
        return super().has_permission(request, view) and request.user.has_perm(settings.KEYCLOAK_WORKER_ROLE)
