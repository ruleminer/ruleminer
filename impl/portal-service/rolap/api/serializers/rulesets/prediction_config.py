from typing import Optional
from typing import TypedDict

from decision_rules.helpers import get_measure_function_by_name
from rest_framework import serializers
from rolap.api.models.rulesets.rulesets_db import Ruleset


class PredictionConfigChoiceOption(TypedDict):
    choices: list[str]
    default: str


class PredictionConfigBooleanOption(TypedDict):
    default: bool


class PredictionConfigOptions(TypedDict):
    prediction_strategy: PredictionConfigChoiceOption
    use_default_rule: PredictionConfigBooleanOption
    voting_measure: Optional[PredictionConfigChoiceOption] = None


class PredictionConfigChoiceOptionSerializer(serializers.Serializer):
    choices = serializers.ListField(
        child=serializers.CharField(), required=True
    )
    default = serializers.CharField(required=True)


class PredictionConfigBooleanOptionSerializer(serializers.Serializer):
    default = serializers.BooleanField(required=True)


class PredictionConfigOptionsSerializer(serializers.Serializer):
    prediction_strategy = PredictionConfigChoiceOptionSerializer()
    use_default_rule = PredictionConfigBooleanOptionSerializer()
    voting_measure = PredictionConfigChoiceOptionSerializer(
        default=None, required=False, allow_null=True)


class PredictionConfigurationSerializer(serializers.Serializer):
    prediction_strategy = serializers.ChoiceField(
        choices=Ruleset.PredictionStrategy.choices,
        required=True, allow_blank=False, allow_null=False
    )
    use_default_rule = serializers.BooleanField(
        required=True, allow_null=False
    )
    voting_measure = serializers.CharField(
        default=None, required=False, allow_null=True)

    def validate_voting_measure(self, value: str):
        if value is None:
            return value
        try:
            _ = get_measure_function_by_name(value)
        except ValueError as e:
            # measure not supported
            raise serializers.ValidationError(
                f"`{value}` is not supported as voting measure "
                f"by `decision-rules` package.") from e
        return value
