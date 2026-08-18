from rest_framework import serializers
from rolap.api.models import CrossValidationResult


class CrossValidationResultRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrossValidationResult
        fields = "__all__"

    celery_task = serializers.IntegerField()
    extra_info = serializers.JSONField(required=False, allow_null=True)
