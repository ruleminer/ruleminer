import re
from dataclasses import asdict

from django.conf import settings
from rest_framework import serializers
from rolap.api.models.labels import Label
from rolap.api.models.rulesets.rulesets import PredictionConfig
from rolap.api.models.rulesets.rulesets_db import Rules
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.serializers.rulesets.prediction_config import \
    PredictionConfigurationSerializer
from rolap.api.serializers.datasets import SortFieldSerializer


class RulesetObjectSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=75)
    description = serializers.CharField(
        max_length=1000, required=False, allow_blank=True, allow_null=True)

    prediction_config = serializers.SerializerMethodField(
        'get_prediction_config'
    )

    def validate_name(self, name):
        if re.match(settings.RULESET_NAME_REGEX, name) is None:
            raise serializers.ValidationError(
                'Name contains forbidden characters'
            )
        return name

    def get_prediction_config(self, obj: Ruleset) -> dict:
        prediction_config: PredictionConfig = obj.prediction_config
        serializer = PredictionConfigurationSerializer(
            data=asdict(prediction_config)
        )
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    class Meta:
        model = Ruleset
        fields = ('id', 'create_timestamp', 'name', 'description', 'generation_params',
                  'rules_count', 'avg_conditions_count', 'avg_precision', 'avg_coverage',
                  'generated_from_dataset',  'algorithm', 'generation_time', 'indicator_calculation_time', 'type', 'prediction_config')
        read_only_fields = ('id', 'create_timestamp', 'generation_params',
                            'rules_count', 'avg_conditions_count', 'avg_precision', 'avg_coverage',
                            'generated_from_dataset', 'algorithm', 'generation_time',
                            'indicator_calculation_time', 'type', 'prediction_config')


class ExampleRulesetObjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ruleset
        fields = '__all__'

    prediction_config = PredictionConfigurationSerializer()


class RuleObjectSerializer(serializers.ModelSerializer):
    assigned_labels = serializers.PrimaryKeyRelatedField(
        queryset=Label.objects.all(), many=True, required=False, allow_null=True, default=[])

    class Meta:
        model = Rules
        fields = '__all__'


class RulesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rules
        fields = ['description']


class AllRuleSetsSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField(max_length=75)


class RuleConclusionSerializer(serializers.Serializer):
    value = serializers.CharField()


class SubconditionSerializer(serializers.Serializer):
    type = serializers.CharField()
    attributes = serializers.ListField(child=serializers.IntegerField())
    negated = serializers.BooleanField()


class PremiseSerializer(serializers.Serializer):
    type = serializers.CharField()
    operator = serializers.CharField()
    subconditions = SubconditionSerializer(many=True)


class MetaSerializer(serializers.Serializer):
    attributes = serializers.ListField(child=serializers.CharField())
    decision_attribute = serializers.CharField()
    decision_attribute_distribution = serializers.DictField(
        child=serializers.IntegerField(),
        required=False
    )
    y_train_median = serializers.FloatField(required=False)
    survival_time_attribute = serializers.CharField(required=False)
    default_conclusion = serializers.DictField(required=False)


class RulesetSerializer(serializers.Serializer):
    meta = MetaSerializer()
    rules = serializers.JSONField()


class ResponseRuleSetsSerializer(serializers.Serializer):
    task_id = serializers.UUIDField()

    def update(self, instance, validated_data):
        instance.celery_task = validated_data.get(
            'task_id', instance.celery_task)
        return instance


class CoverageSerializer(serializers.Serializer):
    rule_coverage = serializers.DictField()


class UniqueExamplesRequestSerializer(serializers.Serializer):
    original_ruleset_id = serializers.IntegerField()
    ruleset = RulesetSerializer()


class UniqueExamplesResponseSerializer(serializers.Serializer):
    unique_examples = serializers.JSONField()


class RequestRulesetSerializer(serializers.Serializer):
    original_ruleset_id = serializers.IntegerField()
    ruleset = RulesetSerializer()
    rule_coverage = serializers.DictField()
    prediction_config = PredictionConfigurationSerializer(required=False)


class PredictionSummaryRequestSerializer(serializers.Serializer):
    dataset_id = serializers.IntegerField()
    ruleset_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=[])


class RequestRulesIndicatorsSerializer(serializers.Serializer):
    ruleset = RulesetSerializer()
    rule_coverage = serializers.DictField()
    bins = serializers.IntegerField(default=20, required=False)


class RequestSingleRuleIndicatorsSerializer(serializers.Serializer):
    rule = serializers.DictField(required=True)
    attributes = serializers.ListField(
        child=serializers.CharField(), required=True)
    metrics_to_calculate = serializers.ListField(
        child=serializers.CharField(), required=False)


class SingleRuleIndicatorsSerializer(serializers.Serializer):
    indicators = serializers.DictField()


class RuleAvailableIndicatorsSerializer(serializers.Serializer):
    indicators = serializers.ListField(child=serializers.CharField())


class RequestHistogramRulesetSerializer(serializers.Serializer):
    ruleset = RulesetSerializer()
    bins = serializers.IntegerField(default=20, required=False)
    for_rules = serializers.ListField(required=False)


class RequestExplainabilitySerializer(serializers.Serializer):
    examples = serializers.ListField(child=serializers.DictField())
    original_ruleset_id = serializers.IntegerField()
    ruleset = RulesetSerializer()
    rule_coverage = serializers.DictField()
    prediction_config = PredictionConfigurationSerializer(required=False)


class ResponseExplainabilitySerializer(serializers.Serializer):
    covering_rules = serializers.DictField(child=serializers.CharField())
    decision = serializers.JSONField()


class RulesetDBSerializer(serializers.Serializer):
    meta = serializers.JSONField()
    rules = serializers.ListField(child=serializers.JSONField())


class RulesetFilterJSONSerializer(serializers.Serializer):
    ruleset = serializers.JSONField()
    unique = serializers.JSONField(required=False, default=[])
    sort = serializers.ListField(child=SortFieldSerializer(), required=False)


class RulesetModifyJSONSerializer(serializers.Serializer):
    ruleset = serializers.JSONField()
    name = serializers.CharField()
    unique = serializers.JSONField(required=False, default=[])
    sort = serializers.ListField(child=SortFieldSerializer(), required=False)


class RuleCoveredIndicesListResponseSerializer(serializers.Serializer):
    rule_id = serializers.ListField(child=serializers.IntegerField())


class ConditionsMetaSerializer(serializers.Serializer):
    attributes = serializers.ListField(child=serializers.CharField())


class ConditionSetSerializer(serializers.Serializer):
    meta = ConditionsMetaSerializer()
    conditions = serializers.ListField(
        child=serializers.ListField(
            child=serializers.JSONField()
        )
    )
    complementary = serializers.BooleanField(required=False, default=False)


class RuleSimilarityRequestSerializer(serializers.Serializer):
    similarity_type = serializers.ChoiceField(
        choices=["semantic", "syntactic"])
    measure = serializers.ChoiceField(
        choices=["Jaccard", "Correlation", "Kulczynski"], required=False)
    ruleset_1 = RulesetSerializer()
    ruleset_2 = RulesetSerializer()

    def validate(self, attrs):
        if attrs["similarity_type"] == "semantic" and attrs.get("measure") is None:
            raise serializers.ValidationError(
                "Measure must be specified for semantic similarity")
        return attrs


class RuleSimilaritySerializer(serializers.Serializer):
    rule_similarity = serializers.DictField()


class RulesetGenerationAlgorithmParamsSerializer(serializers.Serializer):
    generation_algorithm_params = serializers.DictField()


class CoverageMatrixSerializer(serializers.Serializer):
    coverage_matrix = serializers.DictField(child=serializers.ListField(
        child=serializers.BooleanField()
    ))
    prediction = serializers.ListField()


class CoverageMatrixRequestSerializer(serializers.Serializer):
    original_ruleset_id = serializers.IntegerField()
    ruleset = serializers.JSONField()
    rule_coverage = serializers.DictField()
    example_indices = serializers.ListField(
        child=serializers.IntegerField(), required=False)
    prediction_config = PredictionConfigurationSerializer(required=False)


class DatasetInfoSerializer(serializers.Serializer):
    delimiter = serializers.CharField()
    decimal_separator = serializers.CharField()
    encoding = serializers.CharField()
    missing_value_sign = serializers.CharField(
        allow_blank=True, allow_null=True)


class RequestPredictionOnDatasetSerializer(serializers.Serializer):
    dataset_info = DatasetInfoSerializer()
    ruleset_info = RequestRulesetSerializer()


class RulesetCommentItemSerializer(serializers.Serializer):
    code = serializers.CharField()
    context = serializers.JSONField()


class RulesetCommentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ruleset
        fields = ('comments', )

    comments = serializers.ListField(
        child=RulesetCommentItemSerializer(), allow_empty=True)
