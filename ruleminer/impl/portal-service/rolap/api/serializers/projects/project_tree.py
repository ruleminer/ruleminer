from rest_framework import serializers
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.models import Report
from rolap.api.models import Ruleset


class RulesetTreeSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    text = serializers.CharField(source="name")
    type = serializers.SerializerMethodField()
    project_id = serializers.IntegerField(
        source="attached_to_dataset.project.id")
    dataset_id = serializers.IntegerField(source="attached_to_dataset.id")
    ruleset_id = serializers.IntegerField(source="id")

    class Meta:
        model = Ruleset
        fields: list = ("id", "text", "type", "project_id",
                        "dataset_id", "ruleset_id",)

    def get_id(self, obj):
        return f"{obj.attached_to_dataset.project.id}_{obj.attached_to_dataset.id}_0_{obj.id}"

    def get_type(self, obj):
        return "ruleset"


class DatasetReportTreeSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    text = serializers.CharField(source="title")
    type = serializers.CharField()
    project_id = serializers.IntegerField(source="content_object.project.id")
    dataset_id = serializers.IntegerField(source="content_object.id")
    report_id = serializers.IntegerField(source="id")

    class Meta:
        model = Report
        fields: list = ("id", "text", "type", "project_id",
                        "dataset_id", "report_id", )

    def get_id(self, obj):
        return f"{obj.content_object.project.id}_{obj.content_object.id}_1_{obj.id}"


class RulesetGroupTreeSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    text = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    project_id = serializers.IntegerField(source="project.id")
    dataset_id = serializers.IntegerField(source="id")
    items = RulesetTreeSerializer(many=True, source="attached_rulesets")
    limit_reached = serializers.BooleanField(
        source="ruleset_limit_reached", allow_null=True)

    class Meta:
        model = Dataset
        fields: list = ("id", "text", "type", "project_id",
                        "dataset_id", "items", "limit_reached", )

    def get_id(self, obj):
        return f"{obj.project.id}_{obj.id}_0"

    def get_text(self, obj):
        return "Zbiory reguł"

    def get_type(self, obj):
        return "rulesets_group"


class DatasetReportGroupTreeSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    text = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    project_id = serializers.IntegerField(source="project.id")
    dataset_id = serializers.IntegerField(source="id")
    items = DatasetReportTreeSerializer(many=True, source="reports")
    limit_reached = serializers.BooleanField(
        source="report_limit_reached", allow_null=True)

    class Meta:
        model = Dataset
        fields: list = ("id", "text", "type", "project_id",
                        "dataset_id", "items", "limit_reached", )

    def get_id(self, obj):
        return f"{obj.project.id}_{obj.id}_1"

    def get_text(self, obj):
        return "Raporty"

    def get_type(self, obj):
        return "reports_group"


class DatasetItemTreeSerializer(serializers.ModelSerializer):
    rulesets = RulesetGroupTreeSerializer(source="*")
    reports = DatasetReportGroupTreeSerializer(source="*")

    class Meta:
        model = Dataset
        fields: list = ("rulesets", "reports", )

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return [representation["rulesets"], representation["reports"]]


class DatasetTreeSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    text = serializers.CharField(source="name")
    type = serializers.SerializerMethodField()
    project_id = serializers.IntegerField(source="project.id")
    dataset_id = serializers.IntegerField(source="id")
    items = DatasetItemTreeSerializer(source="*")
    is_active = serializers.BooleanField(allow_null=True)

    class Meta:
        model = Dataset
        fields: list = ("id", "text", "type", "project_id",
                        "dataset_id", "items", "is_active", )

    def get_id(self, obj):
        return f"{obj.project.id}_{obj.id}"

    def get_type(self, obj):
        return "dataset"


class ProjectTreeSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(source="id")
    text = serializers.CharField(source="name")
    items = DatasetTreeSerializer(many=True, source="datasets")

    class Meta:
        model = Project
        fields: list = ("id", "text", "project_id", "items", )
