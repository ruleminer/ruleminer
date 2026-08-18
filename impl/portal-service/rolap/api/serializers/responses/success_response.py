from rest_framework import serializers
from rolap.api.responses import SuccessResponse


class SuccessResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()

    def create(self, validated_data):
        return SuccessResponse(**validated_data)

    def update(self, instance, validated_data):
        instance.success = validated_data.get('success', instance.success)
        return instance
