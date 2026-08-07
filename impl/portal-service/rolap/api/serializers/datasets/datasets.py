from rest_framework import serializers
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.datasets import DatasetColumn
from rolap.api.models.datasets import DatasetExtendedRecord
from rolap.api.models.datasets import DatasetPreviewResponse
from rolap.api.models.datasets import DatasetRecord
from rolap.api.models.datasets import GetDatasetRequest
from rolap.api.models.datasets import ModifyDatasetRequest
from rolap.api.models.datasets import UploadDatasetRequest
from rolap.api.serializers.projects import ProjectIdSerializer


class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields: list = ['id', 'name', 'description', 'created_at', 'path']
        read_only_fields: list = ['id', 'created_at', 'path']
    name = serializers.CharField(
        max_length=50, allow_blank=True, allow_null=True, required=False)
    description = serializers.CharField(
        max_length=1000, allow_blank=True, allow_null=True, required=False)


class DatasetObjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = '__all__'


class DatasetAttributesObjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatasetAttributes
        fields = '__all__'


class DatasetAttributesSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatasetAttributes
        fields = ["id", "name", "type", "role"]


class DatasetAttributeNominalValuesSerializer(serializers.Serializer):
    name = serializers.CharField()
    unique_values = serializers.ListField()

    def to_representation(self, instance):
        return {
            instance.name: instance.unique_values
        }


class DatasetAttributeNominalValuesListSerializer(serializers.Serializer):
    attributes = DatasetAttributeNominalValuesSerializer(many=True)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        new_representation = {}
        for attr in representation["attributes"]:
            new_representation.update(attr)
        return new_representation


class DatasetsAcceptedAttributeTypesSerializer(serializers.Serializer):
    types = serializers.ListField()


class DatasetColumnSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    column_type = serializers.CharField(max_length=100)
    role = serializers.CharField(max_length=100)

    def create(self, validated_data):
        return DatasetColumn(**validated_data)

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.column_type = validated_data.get(
            'description', instance.column_type)
        return instance


class DatasetRecordSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    column_values = serializers.ListField(child=serializers.CharField())

    def create(self, validated_data):
        return DatasetRecord(**validated_data)

    def update(self, instance, validated_data):
        instance.id = validated_data.get('id', instance.id)
        instance.column_values = validated_data.get(
            'column_values', instance.column_values)
        return instance


class SortFieldSerializer(serializers.Serializer):
    selector = serializers.CharField()
    desc = serializers.BooleanField()


class DatasetPreviewRequestSerializer(serializers.Serializer):
    columns = serializers.ListField(child=serializers.CharField())
    sort = serializers.ListField(child=SortFieldSerializer(), required=False)

    def create(self, validated_data):
        return GetDatasetRequest(**validated_data)

    def update(self, instance, validated_data):
        instance.columns = validated_data.get('columns', instance.columns)
        return instance


class DatasetPreviewResponseSerializer(serializers.Serializer):
    limit = serializers.IntegerField()
    offset = serializers.IntegerField()
    count = serializers.IntegerField()
    columns = DatasetColumnSerializer(many=True)
    records = DatasetRecordSerializer(many=True)

    def create(self, validated_data):
        return DatasetPreviewResponse(**validated_data)

    def update(self, instance, validated_data):
        instance.limit = validated_data.get('limit', instance.limit)
        instance.offset = validated_data.get('offset', instance.offset)
        instance.count = validated_data.get('count', instance.count)
        instance.columns = validated_data.get('columns', instance.columns)
        instance.records = validated_data.get('records', instance.records)

        return instance


class ModifyDatasetRequestSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=50)
    columns = serializers.ListField(child=serializers.CharField())
    sort = serializers.ListField(
        child=SortFieldSerializer(), required=False)

    def create(self, validated_data):
        return ModifyDatasetRequest(**validated_data)


class CreateDatasetResponseSerializer(serializers.ModelSerializer):
    dataset_id = serializers.IntegerField(source="pk")
    project_id = ProjectIdSerializer(source="project")

    class Meta:
        model = Dataset
        fields = ("dataset_id", "project_id", "name", "description")


class UploadDatasetRequestSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=50)
    description = serializers.CharField(
        max_length=1000, allow_blank=True, allow_null=True, required=False)
    delimiter = serializers.CharField(trim_whitespace=False)
    decimal_separator = serializers.CharField()
    selected_columns = serializers.ListField(
        child=serializers.IntegerField(min_value=0))
    assigned_column_types = serializers.ListField(
        child=serializers.CharField())
    assigned_column_classes = serializers.ListField(
        child=serializers.CharField())
    missing_value_sign = serializers.CharField(required=False, default=None)
    encoding = serializers.CharField()
    header = serializers.BooleanField(default=True)


class DatasetExtendedRecordSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    applied_rules = serializers.ListField(child=serializers.CharField())
    predicted_value = serializers.CharField()
    column_values = serializers.ListField(child=serializers.CharField())

    def create(self, validated_data):
        return DatasetExtendedRecord(**validated_data)

    def update(self, instance, validated_data):
        instance.id = validated_data.get('id', instance.id)
        instance.applied_rules = validated_data.get(
            'applied_rules', instance.applied_rules)
        instance.predicted_value = validated_data.get(
            'predicted_value', instance.predicted_value)
        instance.column_values = validated_data.get(
            'column_values', instance.column_values)
        return instance


class CloneDatasetRequestSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=50)
    description = serializers.CharField(max_length=1000, default=None)
    clone_related = serializers.BooleanField(default=False)


class DatasetSplitSerializer(serializers.Serializer):
    split_ratio = serializers.FloatField()
    training_set_name = serializers.CharField(max_length=50)
    test_set_name = serializers.CharField(max_length=50)
    split_mode = serializers.ChoiceField(
        choices=['chronological', 'random', 'stratified'])

    def validate_split_ratio(self, value):
        """
        Check that the split_ratio is within the exclusive range (0, 1).
        """
        if not (0 < value < 1):
            raise serializers.ValidationError(
                "split_ratio must be between 0 and 1, exclusive.")
        return value
