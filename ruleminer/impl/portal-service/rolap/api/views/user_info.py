import stripe
import os
from django.db import transaction
from keycloak_auth.models import User
from keycloak_auth.serializers import UserLanguageSerializer
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rolap.api.permissions import IsRolapUser
from rolap.api.permissions import IsRolapOperator
from rolap.api.serializers.user_info import UserInfoSerializer
from rolap.api.serializers.user_info import DeleteUserByAdminSerializer
from rolap.api.utils.limits import UserLimits
from keycloak_auth.backend import KeycloakAuthBackend
from rolap.api.exceptions import KeycloakUserDeletionException, GeneralUserDeletionException, UserNotFoundException
from rolap.api.models import Subscription

stripe.api_key = os.environ["STRIPE_TEST_SECRET"]


def delete_user(user, keycloak_backend):
    """
    Helper function to delete a user, their subscription, and related data.
    """
    try:
        # 1. Delete subscription
        try:
            subscription = Subscription.objects.get(user=user)
            stripe.Subscription.delete(subscription.subscription_id)
            subscription.delete()
        except Subscription.DoesNotExist:
            pass
        except stripe.error.StripeError as e:
            raise GeneralUserDeletionException(
                "Stripe subscription cancellation failed") from e

        # 2. Delete user from Keycloak
        if user.keycloak_id:
            try:
                keycloak_backend.delete_user_in_keycloak(user.keycloak_id)
            except Exception as e:
                raise KeycloakUserDeletionException() from e

        # 3. Mark user as inactive first
        user.is_active = False
        user.save()

        # 4. Delete user and cascade-related data
        user.delete()

    except Exception as e:
        raise GeneralUserDeletionException() from e


class UserInfoView(APIView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ["user_info"]

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return UserInfoSerializer()

    schema = _CustomSchema(operation_id_base="user_info")
    permission_classes = [IsRolapUser]

    def get(self, request):
        user = request.user
        limits = UserLimits(user)
        serializer = UserInfoSerializer(limits)
        return Response(serializer.data)


class UserLanguageView(generics.RetrieveUpdateAPIView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ["user_info"]

        def get_request_serializer(self, path, method):
            return UserInfoSerializer()

        def get_response_serializer(self, path, method):
            return UserInfoSerializer()

    schema = _CustomSchema(operation_id_base="user_language_info")
    queryset = User.objects.all()
    serializer_class = UserLanguageSerializer
    permission_classes = [IsRolapUser]

    def get_object(self):
        return self.request.user


class DeleteSelfView(APIView):
    """
    API endpoint to allow a user to delete their own account.
    """
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ["user_info"]

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="delete_self")
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        keycloak_backend = KeycloakAuthBackend()

        delete_user(user, keycloak_backend)

        return Response({"detail": "User account deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


class DeleteUserByAdminView(APIView):
    """
    API endpoint to allow an admin to delete a user by ID and username.
    """
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ["admin_user_management"]

        def get_request_serializer(self, path, method):
            return DeleteUserByAdminSerializer()

        def get_response_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="delete_user_by_admin")
    permission_classes = [IsRolapOperator]

    def delete(self, request):
        serializer = DeleteUserByAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        keycloak_backend = KeycloakAuthBackend()

        user_id = serializer.validated_data["id"]
        username = serializer.validated_data["username"]

        try:
            user = User.objects.get(id=user_id, username=username)
        except User.DoesNotExist:
            return UserNotFoundException()

        delete_user(user, keycloak_backend)

        return Response(
            {"detail": f"User '{username}' with ID {user_id} has been deleted successfully."},
            status=status.HTTP_204_NO_CONTENT,
        )
