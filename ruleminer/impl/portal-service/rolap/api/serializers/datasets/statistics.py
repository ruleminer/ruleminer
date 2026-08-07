from rest_framework import serializers
from rolap.api.models.datasets import ColumnStatistics
from rolap.api.models.datasets import Statistic
from rolap.api.models.datasets import StatisticsHeader
from rolap.api.models.datasets import StatisticsResponse


class StatisticsSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    value = serializers.CharField()

    def create(self, validated_data):
        return Statistic(**validated_data)

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.value = validated_data.get('value', instance.value)
        return instance


class StatisticsHeaderSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    description_id = serializers.CharField()

    def create(self, validated_data):
        return StatisticsHeader(**validated_data)

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.description_id = validated_data.get(
            'description_id', instance.description_id)
        return instance


class ColumnStatisticsSerializer(serializers.Serializer):
    column_name = serializers.CharField()
    column_role = serializers.CharField()
    statistics = StatisticsSerializer(many=True)

    def create(self, validated_data):
        return ColumnStatistics(**validated_data)

    def update(self, instance, validated_data):
        instance.column_name = validated_data.get(
            'column_name', instance.column_name)
        instance.column_role = validated_data.get(
            'column_role', instance.column_role)
        instance.statistics = validated_data.get(
            'statistics', instance.statistics)
        return instance


class StatisticsResponseSerializer(serializers.Serializer):
    headers = StatisticsHeaderSerializer(many=True)
    columns = ColumnStatisticsSerializer(many=True)
    summary = serializers.DictField()

    def create(self, validated_data):
        return StatisticsResponse(**validated_data)

    def update(self, instance, validated_data):
        instance.headers = validated_data.get('headers', instance.headers)
        instance.columns = validated_data.get('columns', instance.columns)
        instance.summary = validated_data.get('summary', instance.summary)
        return instance


class DatasetSummaryResponseSerializer(serializers.Serializer):
    number_of_rows = serializers.IntegerField()
    number_of_columns = serializers.IntegerField()


class DatasetCorrelationMatrixSerializer(serializers.Serializer):
    z = serializers.ListField(
        child=serializers.ListField(child=serializers.FloatField()))
    x = serializers.ListField(child=serializers.CharField())
    y = serializers.ListField(child=serializers.CharField())


class DatasetHistogramSerializer(serializers.Serializer):
    attribute_name = serializers.CharField()
    counts = serializers.ListField(child=serializers.IntegerField())
    division = serializers.ListField(child=serializers.FloatField())


class DatasetCountPlotSerializer(serializers.Serializer):
    attribute_name = serializers.CharField()
    values = serializers.ListField(child=serializers.CharField())
    counts = serializers.ListField(child=serializers.IntegerField())
