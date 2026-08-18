from dataclasses import replace
from typing import Union

from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from rolap.api.models.algorithms import Algorithm
from rolap.api.models.algorithms import VotingMeasures
from rolap.api.models.datasets import Dataset
from rolap.api.models.labels import Label
from rolap.api.models.rulesets.rulesets import PredictionConfig

# name of the algorithms parameters measure
# those measure must be supported with decision_rules package
INDUCTION_MEASURE_PARAMETER: str = 'induction_measure'
VOTING_MEASURE_PARAMETER: str = 'voting_measure'

MEASURES_PARAMETERS_NAME: list[str] = [
    # Common
    VOTING_MEASURE_PARAMETER,

    # RuleKit specific
    INDUCTION_MEASURE_PARAMETER,
    'pruning_measure',

    # DeepRules specific
    'dnf_quality_measure',
    'dnf_pruning_measure',
    'dnf_select_best_candidate_measure',
    'cnf_quality_measure',
    'cnf_pruning_measure',
    'cnf_select_best_candidate_measure',
]

DEFAULT_MEASURE: str = 'Correlation'


class Ruleset(models.Model):
    class Type(models.TextChoices):
        GENERATED = ("generated", "generated")
        MODIFIED = ("modified", "modified")
        MANUAL = ("manual", "manual")
        FILTERED = ("filtered", "filtered")

    class PredictionStrategy(models.TextChoices):
        VOTING = ("vote", "vote")
        BEST_RULE = ("best_rule", "best_rule")

    class Meta:
        unique_together = ("attached_to_dataset", "name")

    id = models.AutoField(primary_key=True)
    create_timestamp = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=75, null=True, blank=True, default="")
    description = models.TextField(null=True, blank=True, default="")
    generation_params = models.JSONField(default=dict)
    ruleset = models.JSONField(default=dict)
    comments = models.JSONField(default=list, null=True)

    rules_count = models.IntegerField(null=True)
    avg_conditions_count = models.FloatField(null=True)
    avg_precision = models.FloatField(null=True)
    avg_coverage = models.FloatField(null=True)
    fraction_significant = models.FloatField(null=True)
    fraction_FDR_significant = models.FloatField(null=True)
    total_conditions_count = models.IntegerField(null=True)
    fraction_examples_covered = models.FloatField(null=True)

    attached_to_dataset = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True, blank=True,
                                            related_name='attached_rulesets')
    generated_from_dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, null=True,
                                               related_name='generated_rulesets')
    algorithm = models.ForeignKey(
        Algorithm, on_delete=models.CASCADE, null=True, blank=True)
    type = models.CharField(
        max_length=16, choices=Type.choices, default=Type.MANUAL
    )
    prediction_strategy = models.CharField(
        max_length=16, choices=PredictionStrategy.choices, default=PredictionStrategy.VOTING
    )
    use_default_rule = models.BooleanField(
        default=True, null=True
    )
    voting_measure = models.CharField(
        max_length=64, null=True)

    generation_time = models.FloatField(null=True)
    indicator_calculation_time = models.FloatField(null=True)
    celery_task = GenericRelation(
        "api.Task",
        content_type_field="result_content_type",
        object_id_field="result_object_id",
    )
    child_tasks = GenericRelation(
        "api.Task",
        content_type_field="source_content_type",
        object_id_field="source_object_id",
    )

    @property
    def owner(self):
        return self.attached_to_dataset.project.owner

    @property
    def project(self):
        return self.attached_to_dataset.project

    @property
    def prediction_result(self):
        return self.predictionresults_set.first()

    @property
    def prediction_config(self) -> PredictionConfig:
        return PredictionConfig(
            prediction_strategy=self.prediction_strategy,
            use_default_rule=self.use_default_rule,
            voting_measure=self.voting_measure,
        )

    @prediction_config.setter
    def prediction_config(self, value: Union[PredictionConfig, dict]):
        if isinstance(value, dict):
            value = PredictionConfig(**value)
        self.prediction_strategy = value.prediction_strategy
        self.use_default_rule = value.use_default_rule
        self.voting_measure = value.voting_measure

    def get_updated_config(self, update_dict: dict) -> PredictionConfig:
        config = self.prediction_config
        config = replace(config, **update_dict)
        VotingMeasures.validate(self.project, config.voting_measure)
        return config


class Rules(models.Model):
    id = models.AutoField(primary_key=True)
    uuid = models.UUIDField(null=True)
    description = models.CharField(
        max_length=500, null=True, blank=True)
    ruleset = models.ForeignKey(
        Ruleset, on_delete=models.CASCADE, related_name="rules")
    p = models.IntegerField(null=True)
    n = models.IntegerField(null=True)
    P = models.IntegerField(null=True)
    N = models.IntegerField(null=True)
    train_covered_y_std = models.FloatField(null=True)
    train_covered_y_mean = models.FloatField(null=True)
    indicators = models.JSONField()
    histogram = models.JSONField(null=True)
    kaplan_meier_estimator = models.JSONField(null=True)
    created_at = models.DateTimeField(auto_now=True)
    assigned_labels = models.ManyToManyField(Label)

    class Meta:
        unique_together = ('ruleset', 'uuid',)

    @property
    def owner(self):
        return self.ruleset.attached_to_dataset.project.owner


class CrossValidationResult(models.Model):
    ruleset = models.ForeignKey(
        Ruleset, on_delete=models.CASCADE, related_name="cross_validation")
    num_folds = models.IntegerField()
    result = models.JSONField(default=dict)
    celery_task = GenericRelation(
        "api.Task",
        content_type_field="result_content_type",
        object_id_field="result_object_id",
    )

    @property
    def owner(self):
        return self.ruleset.attached_to_dataset.project.owner
