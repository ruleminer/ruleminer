from keycloak_auth.models import User
from rest_framework import serializers


class LogoutPayloadSerializer(serializers.Serializer):
    refresh_token = serializers.CharField(max_length=1000)


class UserLanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['preferred_language']
