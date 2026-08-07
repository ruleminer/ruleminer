from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers


class ContentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentType
        fields = ("model", )

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return representation["model"]
