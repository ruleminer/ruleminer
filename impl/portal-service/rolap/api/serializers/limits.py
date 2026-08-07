from rest_framework import serializers
from rolap.api.models import LimitGroup


class LimitGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = LimitGroup
        fields = "__all__"
        extra_kwargs = {
            "plan": {"required": True},
        }


class UserLimitSerializer(serializers.Serializer):
    max_rows = serializers.IntegerField()
    max_columns = serializers.IntegerField()
    max_size = serializers.IntegerField()
    max_sum_size = serializers.IntegerField()
    space_used = serializers.IntegerField()
    max_datasets = serializers.IntegerField()
    max_projects = serializers.IntegerField()
    max_rulesets = serializers.IntegerField()
    max_reports = serializers.IntegerField()
