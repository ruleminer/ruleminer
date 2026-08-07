from rest_framework import serializers
from rolap.api.models import Rules
from rolap.api.serializers.rulesets.rulesets import RulesetSerializer


class RuleCoverageSerializer(serializers.Serializer):
    p = serializers.IntegerField()
    n = serializers.IntegerField()
    P = serializers.IntegerField()
    N = serializers.IntegerField()

    # regression specific fields
    train_covered_y_std = serializers.FloatField(required=False)
    train_covered_y_mean = serializers.FloatField(required=False)

    # survival specific fields
    median_survival_time = serializers.CharField(required=False)
    median_survival_time_ci_lower = serializers.CharField(required=False)
    median_survival_time_ci_upper = serializers.CharField(required=False)
    events_count = serializers.IntegerField(required=False)
    censored_count = serializers.IntegerField(required=False)
    log_rank = serializers.FloatField(required=False)
    kaplan_meier_estimator = serializers.DictField(required=False)


class RuleDBCoverageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rules
        fields = (
            'uuid', 'p', 'n', 'P', 'N', 'indicators',
            'train_covered_y_std', 'train_covered_y_mean', 'kaplan_meier_estimator',
        )

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return {key: value for key, value in representation.items() if value is not None}


class CalculateCharacteristicsRequestSerializer(serializers.Serializer):
    type = serializers.CharField()
    ruleset = RulesetSerializer()
    rule_coverage = serializers.DictField(child=RuleCoverageSerializer())
    dataset_path = serializers.CharField(required=False)


class QuantitativeCharacteristicsSerializer(serializers.Serializer):
    rules_count = serializers.IntegerField()
    avg_conditions_count = serializers.FloatField()
    avg_precision = serializers.FloatField()
    avg_coverage = serializers.FloatField()
    fraction_significant = serializers.FloatField(required=False)
    fraction_FDR_significant = serializers.FloatField(required=False)
    total_conditions_count = serializers.IntegerField()


class CalculateIndicatorsRequestSerializer(serializers.Serializer):
    type = serializers.CharField()
    ruleset = RulesetSerializer()
    original_ruleset_id: serializers.IntegerField()
    rule_coverage = serializers.DictField(child=RuleCoverageSerializer())
    dataset_path = serializers.CharField()


class CalculateHistogramsRequestSerializer(serializers.Serializer):
    dataset_path = serializers.CharField()
    type = serializers.CharField()
    bins = serializers.IntegerField(min_value=5, max_value=100, default=10)
    ruleset = serializers.DictField()
    for_rules = serializers.ListField(
        child=serializers.CharField(), required=False)


class IndicatorSerializer(serializers.Serializer):
    p_unique = serializers.FloatField()
    n_unique = serializers.FloatField()
    num_of_conditions = serializers.FloatField()
    precision = serializers.FloatField()
    coverage = serializers.FloatField()
    C2 = serializers.FloatField()
    RSS = serializers.FloatField()
    correlation = serializers.FloatField()
    lift = serializers.FloatField()
    p_val_adjusted = serializers.FloatField()


class CalculateRulesetIndicatorSerializer(serializers.Serializer):
    rule_uuid = serializers.UUIDField()
    indicators = IndicatorSerializer(many=True)


class CalculateRuleCoverageRequestSerializer(serializers.Serializer):
    dataset_path = serializers.CharField()
    type = serializers.CharField()
    ruleset = RulesetSerializer()


class CalculatePredictionIndicatorsRequestSerializer(serializers.Serializer):
    dataset_path = serializers.CharField()
    type = serializers.CharField()
    ruleset = RulesetSerializer()
    rule_coverage = serializers.DictField(child=RuleCoverageSerializer())


class CalculatePredictionIndicatorsResponseSerializer(serializers.Serializer):
    type = serializers.CharField()
    general = serializers.DictField()
    for_classes = serializers.DictField()


class CalculateImportanceRequestSerializer(serializers.Serializer):
    dataset_path = serializers.CharField()
    type = serializers.CharField()
    measure = serializers.CharField()
    ruleset = RulesetSerializer()
    rule_coverage = serializers.DictField()


class DatasetKaplanMeierSerializer(serializers.Serializer):
    time = serializers.ListField(child=serializers.FloatField())
    events_count = serializers.ListField(child=serializers.IntegerField())
    censored_count = serializers.ListField(child=serializers.IntegerField())
    at_risk_count = serializers.ListField(child=serializers.IntegerField())
    probability = serializers.ListField(child=serializers.FloatField())
