from rest_framework import serializers
from rolap.api.models import CrossValidationResult
from rolap.api.models import Ruleset
from rolap.api.models.results import ImportanceResults
from rolap.api.models.results import PredictionResults


class ConfusionMatrixSerializer(serializers.Serializer):
    true_positive = serializers.IntegerField()
    false_positive = serializers.IntegerField()
    true_negative = serializers.IntegerField()
    false_negative = serializers.IntegerField()


class ClassSerializer(serializers.Serializer):
    TP = serializers.IntegerField()
    FP = serializers.IntegerField()
    TN = serializers.IntegerField()
    FN = serializers.IntegerField()
    Recall = serializers.FloatField()
    Specificity = serializers.FloatField()
    F1_score = serializers.FloatField()
    G_mean = serializers.FloatField()
    MCC = serializers.FloatField()
    PPV = serializers.FloatField()
    NPV = serializers.FloatField()
    LR_plus = serializers.FloatField()
    LR_minus = serializers.FloatField()
    Odd_ratio = serializers.FloatField()
    Relative_risk = serializers.FloatField()
    Confusion_matrix = serializers.DictField()


class PredictionIndicatorsSerializer(serializers.Serializer):
    type_of_problem = serializers.CharField()
    general = serializers.DictField()
    for_classes = serializers.DictField(
        child=ClassSerializer(), required=False)


class PredictionIndicatorsListSerializer(serializers.ModelSerializer):
    indicators = PredictionIndicatorsSerializer(
        source="prediction_result.results")

    class Meta:
        model = Ruleset
        fields = ("id", "name", "indicators", )


class PredictionSummaryCalculatedSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    indicators = PredictionIndicatorsSerializer()


class DropNullFieldsSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        keys = list(data.keys())
        for key in keys:
            if data[key] is None:
                data.pop(key)
        return data


class QuantitativeCharacteristicsSerializer(DropNullFieldsSerializer):
    class Meta:
        model = Ruleset
        fields = (
            "rules_count", "avg_conditions_count", "avg_precision", "avg_coverage",
            "fraction_significant", "fraction_FDR_significant", "total_conditions_count",
            "fraction_examples_covered",
        )


class QuantitativeCharacteristicsListSerializer(DropNullFieldsSerializer):
    class Meta:
        model = Ruleset
        fields = (
            "id", "name",
            "rules_count", "avg_conditions_count", "avg_precision", "avg_coverage",
            "fraction_significant", "fraction_FDR_significant", "total_conditions_count",
            "fraction_examples_covered",
        )


class ImportanceSerializer(serializers.Serializer):
    condition_importance = serializers.DictField()
    attribute_importance = serializers.DictField()


class CrossValidationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrossValidationResult
        fields = "__all__"


class PredicitonResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionResults
        fields = "__all__"


class ImportnanceResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportanceResults
        fields = "__all__"


class ExampleCoverageSerializer(serializers.Serializer):
    rule_id = serializers.UUIDField()
    covered_rows = serializers.ListField(child=serializers.IntegerField())


class IndicatorsSerializer(serializers.Serializer):
    rule_uuid = serializers.UUIDField()
    indicators = serializers.DictField()


class HistogramsSerializer(serializers.Serializer):
    max = serializers.IntegerField()
    min = serializers.IntegerField()
    bin_edges = serializers.ListField()
    histograms = serializers.DictField()


class RulesDataSerializer(serializers.Serializer):
    indicators_data = IndicatorsSerializer(many=True)
    histograms_data = HistogramsSerializer(required=False)


class RuleDataSerializer(serializers.Serializer):
    indicators_data = IndicatorsSerializer(many=True)


class PredictionIndicatorsSerializer(serializers.Serializer):
    type_of_problem = serializers.CharField()
    general = serializers.DictField()
    for_classes = serializers.DictField(
        child=ClassSerializer(), required=False)
    histogram = serializers.DictField(required=False)
