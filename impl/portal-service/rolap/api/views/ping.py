from rest_framework import serializers
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema


class PingResult:
    def __init__(self, success):
        self.success = success


class PingResultSerializer(serializers.Serializer):
    success = serializers.BooleanField()

    def create(self, validated_data):
        return PingResult(**validated_data)

    def update(self, instance, validated_data):
        instance.success = validated_data.get('success', instance.success)
        return instance


class PingView(RetrieveAPIView):
    """
        Test endpoint to check if everything works.
    """

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['ping']

    schema = _CustomSchema(operation_id_base="ping")
    serializer_class = PingResultSerializer
    permission_classes = (AllowAny,)

    def get(self, *args, **kwargs):
        ping_result = PingResult(True)
        serializer = PingResultSerializer(ping_result, many=False)

        return Response(serializer.data)
