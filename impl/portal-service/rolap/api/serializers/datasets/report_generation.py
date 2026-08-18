import enum

from rest_framework import serializers


class StrategyNumericalChoices(enum.Enum):
    MEAN = "mean"
    MEDIAN = "median"
    MOST_FREQUENT = "most_frequent"
    CONSTANT = "constant"

    @classmethod
    def list(cls):
        return list(map(lambda c: c.value, cls))


class StrategyNominalChoices(enum.Enum):
    MOST_FREQUENT = "most_frequent"
    CONSTANT = "constant"

    @classmethod
    def list(cls):
        return list(map(lambda c: c.value, cls))


def validate_ismt_threshold(value):
    necessary_keys = frozenset({"I", "S", "M", "T"})
    if necessary_keys != set(value.keys()):
        raise serializers.ValidationError(
            f"Missing some of the necessary keys: {', '.join(necessary_keys)}")
    for key, val in value.items():
        if val < 0 or val > 1:
            raise serializers.ValidationError(
                "All values must be between 0 and 1.")
    return value


def validate_unimportant_attributes_elimination(attrs):
    if attrs.get("unimportant_attr_elimination") is True:
        ismt_threshold = attrs.get("ismt_threshold")
        if ismt_threshold is None:
            raise serializers.ValidationError(
                "ISMT threshold is required for unimportant attributes elimination.")
        validate_ismt_threshold(ismt_threshold)


def validate_missing_values_imputation_strategy(attrs):
    if attrs.get("missing_values_imputation") is True:
        if attrs.get("strategy_numerical") is None or attrs.get("strategy_nominal") is None:
            raise serializers.ValidationError(
                "Strategy for missing values imputation is required.")


class DatasetEDAReportSerializer(serializers.Serializer):
    title = serializers.CharField()


class PredictionReportSerializer(serializers.Serializer):
    title = serializers.CharField()
    settings = serializers.JSONField()
    preprocessing = serializers.JSONField()
    algorithms = serializers.JSONField()


class DiscoveryReportSerializer(serializers.Serializer):
    title = serializers.CharField()
    preprocessing = serializers.JSONField()
    algorithms = serializers.JSONField()
