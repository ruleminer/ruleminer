from rest_framework import serializers
from rolap.api.serializers.rulesets.rulesets import \
    PredictionConfigurationSerializer


class AttributeSerializer(serializers.Serializer):
    name = serializers.CharField()
    role = serializers.CharField()


class CreateRuleSetsWorkerSerializer(serializers.Serializer):
    name = serializers.CharField()
    description = serializers.CharField(max_length=1000)
    generation_method = serializers.CharField()
    algorithm_params = serializers.DictField()
    expert_induction = serializers.DictField(allow_null=True, required=False)
    attributes = AttributeSerializer(many=True)
    cross_validation = serializers.BooleanField()
    num_folds = serializers.IntegerField(allow_null=True)
    dataset_id = serializers.IntegerField(allow_null=True, required=False)
    dataset_storage_path = serializers.CharField()
    algorithm_id = serializers.IntegerField(allow_null=True, required=False)
    prediction_config = PredictionConfigurationSerializer(
        allow_null=False, required=True, many=False
    )


class CreateCrossValidationWorkerRequestSerializer(serializers.Serializer):
    ruleset_id = serializers.IntegerField()
    dataset_id = serializers.IntegerField()
    dataset_storage_path = serializers.CharField()
    algorithm_params = serializers.DictField()
    algorithm_id = serializers.IntegerField()
    attributes = AttributeSerializer(many=True)
    num_folds = serializers.IntegerField()
    prediction_config = PredictionConfigurationSerializer(
        allow_null=False, required=True, many=False
    )
