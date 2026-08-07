from rest_framework import serializers
from rolap.api.responses import BadResponse


class BadResponseSerializer(serializers.Serializer):
    err_code = serializers.IntegerField()
    err_msg = serializers.CharField(max_length=200)
    err_msg_id = serializers.CharField(max_length=100)

    def create(self, validated_data):
        return BadResponse(**validated_data)

    def update(self, instance, validated_data):
        instance.err_code = validated_data.get('err_code', instance.err_code)
        instance.err_msg = validated_data.get('err_msg', instance.err_msg)
        instance.err_msg_id = validated_data.get(
            'err_msg_id', instance.err_msg_id)
        return instance
