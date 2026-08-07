from rest_framework import serializers


class CreateExampleProjectResponseSerializer(serializers.Serializer):
    project_id = serializers.IntegerField(required=True)
