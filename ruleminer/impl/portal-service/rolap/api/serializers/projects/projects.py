from enum import Enum

from rest_framework import serializers
from rolap.api.models import Dataset
from rolap.api.models import DatasetAttributes
from rolap.api.models import Project


class ProjectSerializer(serializers.ModelSerializer):
    description = serializers.CharField(
        max_length=1000, required=False, allow_blank=True, allow_null=True)
    name = serializers.CharField(
        max_length=50)

    class Meta:
        model: Project = Project
        fields: list = ['id', 'name', 'description',
                        'type_of_problem', 'created_at', 'updated_at', 'last_opened_at']
        read_only_fields: list = [
            'id', 'created_at', 'updated_at', 'last_opened_at']


class MatchingAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatasetAttributes
        fields = ["name", "type"]


class MatchingAttributesRequestSerializer(serializers.Serializer):

    dataset_id = serializers.IntegerField(required=True)
    must_contain_all_given_attributes = serializers.BooleanField(
        required=False, default=True
    )


class MatchingDatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields: list = ["id", "name"]


class ProjectIdSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", )

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return representation["id"]
