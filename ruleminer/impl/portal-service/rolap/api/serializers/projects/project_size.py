from rest_framework import serializers
from rolap.api.models import Dataset
from rolap.api.models import Project


class ProjectSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = (
            "id", "name", "type_of_problem", "created_at", "updated_at", "last_opened_at",
            "dataset_count", "ruleset_count", "report_count", "total_size",
        )

    dataset_count = serializers.IntegerField()
    ruleset_count = serializers.IntegerField()
    report_count = serializers.IntegerField()
    total_size = serializers.IntegerField()


class DatasetSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = (
            "id", "name", "size", "number_of_rows", "number_of_columns",
            "ruleset_count", "report_count", "is_active",
        )

    ruleset_count = serializers.IntegerField()
    report_count = serializers.IntegerField()
    is_active = serializers.BooleanField(allow_null=True)
