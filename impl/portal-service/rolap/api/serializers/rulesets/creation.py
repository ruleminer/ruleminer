from decision_rules.filtering import FilterAlgorithm
from rest_framework import serializers
from rolap.api.models import Ruleset
from rolap.api.models.algorithms import RuleSetImportAlgorithm
from rolap.api.serializers.projects import ProjectIdSerializer
from rolap.api.serializers.rulesets.rulesets import \
    PredictionConfigurationSerializer


class RulesetGenerationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=75)
    description = serializers.CharField(max_length=1000, allow_blank=True)
    generation_method = serializers.CharField()
    algorithm_params = serializers.DictField(required=False)
    expert_induction = serializers.DictField(required=False)
    attributes_to_skip = serializers.ListField(child=serializers.CharField())
    cross_validation = serializers.BooleanField()
    num_folds = serializers.IntegerField(allow_null=True, default=None)
    algorithm_id = serializers.IntegerField()
    survey = serializers.DictField(required=False)
    prediction_config = PredictionConfigurationSerializer(
        required=True, many=False
    )

    def validate(self, data):
        if data["cross_validation"]:
            if data["num_folds"] is None:
                raise serializers.ValidationError(
                    "You have to pass a value for `num_folds` if `cross_validation` is set to `True`.")
            if data["num_folds"] < 1:
                raise serializers.ValidationError(
                    "Number of validation folds must be >= 1.")
        if "algorithm_params" not in data and "survey" not in data:
            raise serializers.ValidationError(
                "Either `algorithm_params` or `survey` must be provided.")
        if data.get("algorithm_params") is not None and data.get("survey") is not None:
            raise serializers.ValidationError(
                "Both `algorithm_params` and `survey` cannot be provided together.")
        return data


class RulesetStatisticsSerializer(serializers.Serializer):
    rule_coverage = serializers.DictField()
    characteristics = serializers.DictField()
    rule_indicators = serializers.DictField()
    condition_importance = serializers.DictField()
    attribute_importance = serializers.DictField()
    prediction_indicators = serializers.DictField()
    rule_histograms = serializers.DictField(allow_null=True, required=False)
    calculation_time = serializers.FloatField()


class CommitRulesetSerializer(serializers.Serializer):
    # parameters that should be filled with the request
    celery_task = serializers.IntegerField()
    algorithm_id = serializers.IntegerField()
    name = serializers.CharField(max_length=75)
    description = serializers.CharField(
        max_length=1000, allow_null=True, allow_blank=True, required=False)
    generation_params = serializers.DictField(default={})
    ruleset = serializers.JSONField()
    attached_to_dataset_id = serializers.IntegerField()
    generated_from_dataset_id = serializers.IntegerField()
    cross_validation = serializers.BooleanField(allow_null=True)
    num_folds = serializers.IntegerField(allow_null=True, default=None)
    generation_time = serializers.FloatField()
    extra_info = serializers.JSONField(allow_null=True, required=False)
    prediction_config = PredictionConfigurationSerializer(
        required=True, allow_null=False, many=False)
    statistics = RulesetStatisticsSerializer()


class RulesetKwargsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ruleset
        fields = (
            "name", "description", "type",
            "attached_to_dataset", "generated_from_dataset",
            "prediction_config",
        )


class CommitStatisticsSerializer(serializers.Serializer):
    ruleset_kwargs = serializers.JSONField(default={})
    ruleset = serializers.JSONField()
    generation_params = serializers.DictField()
    statistics = RulesetStatisticsSerializer()
    rules_labels = serializers.DictField(
        child=serializers.ListField(
            child=serializers.IntegerField(min_value=1)
        ),
        required=True,
        allow_null=False,
    )
    celery_task = serializers.IntegerField()
    extra_info = serializers.JSONField(allow_null=True, required=False)
    overwrite_ruleset_id = serializers.IntegerField(
        allow_null=True, default=None)
    prediction_config = PredictionConfigurationSerializer(
        allow_null=False, required=True, many=False
    )
    comments = serializers.JSONField(allow_null=True, required=False)


class CloneRulesetSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=75)
    description = serializers.CharField(
        max_length=1000, required=False, allow_blank=True)


CopyRulesetSerializer = CloneRulesetSerializer


class FilterRulesetSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=75)
    description = serializers.CharField(
        max_length=1000, required=False, allow_blank=True)
    filter_algorithm = serializers.CharField()
    loss = serializers.FloatField(default=1.0, allow_null=True)
    prediction_config = PredictionConfigurationSerializer(
        allow_null=False, required=True, many=False
    )

    def validate_filter_algorithm(self, value: str):
        try:
            _ = FilterAlgorithm(value)
        except ValueError:
            values = [alg.value for alg in FilterAlgorithm]
            raise serializers.ValidationError(
                f"Invalid filter algorithm. Supported algorithm are: {', '.join(values)}."  # noqa
            )
        return value

    def validate_loss(self, value: float):
        if not 0.0 <= value <= 1.0:
            raise serializers.ValidationError(
                "Loss must a fraction between 0.0 and 1.0")
        return value


class UserCreateRulesetSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=75)
    description = serializers.CharField(
        max_length=1000, required=False, allow_blank=True)
    generation_params = serializers.DictField(default={})
    ruleset = serializers.JSONField()
    rules_labels = serializers.DictField(
        child=serializers.ListField(
            child=serializers.IntegerField(min_value=1)
        ),
        required=True,
        allow_null=False,
    )
    attached_to_dataset_id = serializers.IntegerField()
    prediction_config = PredictionConfigurationSerializer(
        allow_null=False, required=True, many=False
    )


class SaveRulesetSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=75)
    description = serializers.CharField(
        max_length=1000, required=False, allow_blank=True)
    ruleset = serializers.JSONField()
    rules_labels = serializers.DictField(
        child=serializers.ListField(
            child=serializers.IntegerField(min_value=1)
        ),
        required=True,
        allow_null=False,
    )
    attached_to_dataset_id = serializers.IntegerField()
    prediction_config = PredictionConfigurationSerializer(
        allow_null=False, required=True, many=False
    )


class OverwriteRulesetSerializer(serializers.Serializer):
    ruleset = serializers.JSONField()
    rules_labels = serializers.DictField(
        child=serializers.ListField(
            child=serializers.IntegerField(min_value=1)
        ),
        required=True,
        allow_null=False,
    )
    prediction_config = PredictionConfigurationSerializer(
        allow_null=False, required=False, many=False
    )


class CreateRulesetResponseSerializer(serializers.ModelSerializer):
    project = ProjectIdSerializer()

    class Meta:
        model = Ruleset
        fields = ("id", "name", "description",
                  "attached_to_dataset", "project")


class ElementaryConditionSerializer(serializers.Serializer):
    type = serializers.CharField()
    left = serializers.FloatField(allow_null=True, required=False)
    right = serializers.FloatField(allow_null=True, required=False)
    negated = serializers.BooleanField()
    attribute = serializers.CharField()
    left_closed = serializers.BooleanField()
    right_closed = serializers.BooleanField()
    refine = serializers.BooleanField(allow_null=True, required=False)


class PermiseSerializer(serializers.Serializer):
    type = serializers.CharField()
    operator = serializers.CharField(required=False)
    subconditions = serializers.ListSerializer(
        child=serializers.DictField(), required=False)


class PrefferedPermiseSerializer(PermiseSerializer):
    number = serializers.CharField()


class ConclusionSerializer(serializers.Serializer):
    value = serializers.CharField()


class RuleSerializer(serializers.Serializer):
    premise = PermiseSerializer()
    conclusion = ConclusionSerializer()


class ExpertInductionSerializer(serializers.Serializer):
    decision_attribute = serializers.CharField()
    expert_rules = RuleSerializer(many=True)
    expert_preferred_conditions = serializers.DictField(
        child=PrefferedPermiseSerializer(many=True))
    expert_forbidden_conditions = serializers.DictField(
        child=PermiseSerializer(many=True))
    expert_preferred_attributes = serializers.DictField(
        child=serializers.DictField(child=serializers.CharField()))
    expert_forbidden_attributes = serializers.DictField(
        child=serializers.ListSerializer(child=serializers.CharField()))
    extend_using_preferred = serializers.BooleanField()
    extend_using_automatic = serializers.BooleanField()
    induce_using_preferred = serializers.BooleanField()
    induce_using_automatic = serializers.BooleanField()
    preferred_conditions_per_rule = serializers.IntegerField()
    preferred_attributes_per_rule = serializers.IntegerField()
    consider_other_classes = serializers.BooleanField(
        required=False, allow_null=True
    )


class UploadRulesetSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=75)
    description = serializers.CharField(
        max_length=1000, required=False, allow_blank=True)
    prediction_config = PredictionConfigurationSerializer(
        allow_null=False, required=True, many=False
    )
    external_algorithm_name = serializers.ChoiceField(
        choices=[], required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Dynamically set choices
        self.fields['external_algorithm_name'].choices = [
            (alg.name, alg.name) for alg in RuleSetImportAlgorithm.objects.all()
        ]
