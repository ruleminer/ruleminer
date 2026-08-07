from rest_framework import serializers
from rolap.api.models.labels import Label


class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ['id', 'name', 'color']
        read_only_fields = ['id', 'owner']
