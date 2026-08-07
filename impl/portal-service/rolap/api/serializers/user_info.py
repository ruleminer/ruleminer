from rest_framework import serializers
from rolap.api.serializers.limits import UserLimitSerializer


class UserInfoSerializer(serializers.Serializer):
    email = serializers.EmailField(source="user.email")
    plan = serializers.CharField()
    current_limits = UserLimitSerializer(source="*")
    preferred_language = serializers.CharField(
        source="user.preferred_language")


class DeleteUserByAdminSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)
    username = serializers.CharField(required=True)
