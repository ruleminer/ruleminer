"""The serializers in this module are only used for expert induction.
Although they look very similar to those in the decision-rules package
there are some differences that make their existence necessary"""
from rest_framework import serializers


class _BaseExpertConditionSerializer(serializers.Serializer):
    attribute = serializers.CharField()
    type = serializers.ChoiceField([
        'elementary_numerical',
        'elementary_nominal',
    ])
    negated = serializers.BooleanField()
    refine = serializers.BooleanField(default=False)
    determine = serializers.BooleanField(default=False)

    def validate_negated(self, value: bool):
        if value:
            raise serializers.ValidationError(
                'Negated conditions are not supported in expert induction.'
            )
        return value

    def _create_any_value_condition_str(self, attribute: str) -> str:
        return f"{attribute} @= Any"


class NumericalConditionSerializer(_BaseExpertConditionSerializer):
    left = serializers.FloatField(allow_null=True)
    right = serializers.FloatField(allow_null=True)
    left_closed = serializers.BooleanField()
    right_closed = serializers.BooleanField()

    def __str__(self) -> str:
        attribute: str = self.validated_data.get('attribute')
        # create special any value condition
        if self.validated_data.get('determine'):
            return self._create_any_value_condition_str(attribute)

        left = self.validated_data.get('left')
        left_bound = '-inf' if left is None else str(left)
        right = self.validated_data.get('right')
        right_bound = 'inf' if right is None else str(right)
        negation_str = '!' if self.validated_data.get('negated') else ''
        left_bracket = '<' if self.validated_data.get('left_closed') else '('
        right_bracket = '>' if self.validated_data.get('right_closed') else ')'
        equality_symbol = '@=' if self.validated_data.get('refine') else '='

        return f"{attribute} {negation_str}{equality_symbol} {left_bracket}{left_bound}, {right_bound}{right_bracket}"


class NominalConditionSerializer(_BaseExpertConditionSerializer):
    value = serializers.CharField()

    def __str__(self) -> str:
        attribute: str = self.validated_data.get('attribute')
        # create special any value condition
        if self.validated_data.get('determine'):
            return self._create_any_value_condition_str(attribute)

        negation_str = '!' if self.validated_data.get('negated') else ''
        equality_symbol = '@=' if self.validated_data.get('refine') else '='
        value = self.validated_data.get('value')

        return f"{attribute} {negation_str}{equality_symbol} {{{value}}}"
