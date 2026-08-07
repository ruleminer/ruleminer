from rest_framework import serializers
from rolap.api.models import Dataset
from rolap.api.models import Report
from rolap.api.serializers.content_type import ContentTypeSerializer


class CreateDatasetReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ("title", "storage_path", "type",
                  "generation_params", "celery_task", )

    title = serializers.CharField(max_length=75)
    celery_task = serializers.IntegerField()


class ReportMetadataSerializer(serializers.ModelSerializer):
    content_type = ContentTypeSerializer()
    url = serializers.SerializerMethodField()

    def get_url(self, obj):
        return f"/api/reports/{obj.pk}"

    class Meta:
        model = Report
        fields = ("id", "title", "type", "generation_params",
                  "content_type", "object_id", "url", )


class DatasetReportsSerializer(serializers.ModelSerializer):
    reports = ReportMetadataSerializer(many=True)

    class Meta:
        model = Dataset
        fields = ("reports", )


class ReportRenameSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=75)
