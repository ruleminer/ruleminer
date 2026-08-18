from typing import List
from typing import Optional
from typing import Tuple

from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rolap.api.exceptions import InvalidRequestException
from rolap.api.models.projects import Project


class Algorithm(models.Model):
    CLASSIFICATION: str = 'classification'
    REGRESSION: str = 'regression'
    SURVIVAL: str = 'survival'
    TYPE_OF_PROBLEM: List[Tuple[str, str]] = [
        (CLASSIFICATION, 'Classification'),
        (REGRESSION, 'Regression'),
        (SURVIVAL, 'Survival'),
    ]
    id = models.AutoField(primary_key=True)
    problem_type: models.CharField = models.CharField(
        max_length=20, choices=TYPE_OF_PROBLEM)
    name: models.CharField = models.CharField(max_length=50)
    version: models.CharField = models.CharField(max_length=16)
    # whether it supports expert induction
    expert_induction: models.BooleanField = models.BooleanField(default=True)
    # whether it supports not advanced generation with user survey
    na_generation: models.BooleanField = models.BooleanField(default=True)
    description_pl: models.TextField = models.TextField()
    description_en: models.TextField = models.TextField()

    class Meta:
        unique_together = ['problem_type', 'name', 'version']

    def __str__(self):
        return self.name

    @property
    def parameters(self):
        return self.algorithm_parameters.filter(expert_induction=False).all()

    @property
    def expert_parameters(self):
        return self.algorithm_parameters.filter(expert_induction=True).all()


class AlgorithmParams(models.Model):
    CHOICE: str = 'choice'
    INTEGER: str = 'int'
    FLOAT: str = 'float'
    BOOL: str = 'bool'
    INPUT: str = 'input'
    EXPERT_RULES: str = 'expert_rules'
    EXPERT_CONDITIONS: str = 'expert_conditions'
    EXPERT_ATTRIBUTES: str = 'expert_attributes'

    TYPE_OF_PARAMETER: List[Tuple[str, str]] = [
        (CHOICE, 'choice'),
        (INTEGER, 'int'),
        (FLOAT, 'float'),
        (BOOL, 'bool'),
        (INPUT, 'input'),
        (EXPERT_RULES, 'expert_rules'),
        (EXPERT_CONDITIONS, 'expert_conditions'),
        (EXPERT_ATTRIBUTES, 'expert_attributes'),
    ]

    algorithm: models.ForeignKey = models.ForeignKey(
        Algorithm, on_delete=models.CASCADE, related_name="algorithm_parameters")
    name: models.CharField = models.CharField(max_length=50)
    parameter_name_pl: models.CharField = models.CharField(
        max_length=100, null=True)
    parameter_name_en: models.CharField = models.CharField(
        max_length=100, null=True)
    parameter_type: models.CharField = models.CharField(
        max_length=20, choices=TYPE_OF_PARAMETER)
    expert_induction: models.BooleanField = models.BooleanField(default=False)
    description_pl: models.TextField = models.TextField()
    description_en: models.TextField = models.TextField()
    default_value: models.CharField = models.CharField(
        max_length=50, blank=True)
    min_value: models.CharField = models.CharField(max_length=50, null=True)
    max_value: models.CharField = models.CharField(max_length=50, null=True)

    def __str__(self):
        return self.name

    def parameter_values(self):
        return self.choice_values.all()

    @property
    def cast_min_value(self):
        return self.cast_value(self.min_value, -1)

    @property
    def cast_max_value(self):
        return self.cast_value(self.max_value, 1)

    def cast_value(self, value, sign: int = 1):
        if value is None and self.parameter_type in [self.INTEGER, self.FLOAT]:
            return sign * float("inf")
        if self.parameter_type == self.INTEGER:
            return int(value)
        if self.parameter_type == self.FLOAT:
            return float(value)
        if self.parameter_type == self.BOOL:
            if isinstance(value, bool):
                return value
            if not isinstance(value, str):
                raise ValueError(
                    'For boolean parameters value must be a string "true" or '
                    '"false", or boolean'
                )
            value = value.lower()
            if value == 'true':
                return True
            if value == 'false':
                return False
            raise ValueError(
                'For boolean parameters value must be "true" or "false" '
                '(case insensitive)'
            )
        return value

    def validate_value(self, value):
        try:
            if self.parameter_type == self.CHOICE:
                return self.choice_values.filter(value=value).exists()
            if self.parameter_type in [self.INTEGER, self.FLOAT]:
                is_valid = self.cast_min_value <= value <= self.cast_max_value
                if self.parameter_type == self.INTEGER:
                    is_valid &= value == int(value)
                return is_valid
            if self.parameter_type == self.BOOL:
                return value in [True, False]
        except (TypeError, ValueError):
            return False
        return True


class ParamsChoiceValues(models.Model):
    algorithm_params: models.ForeignKey = models.ForeignKey(
        AlgorithmParams, on_delete=models.CASCADE, related_name="choice_values")
    value: models.CharField = models.CharField(max_length=50)
    description_pl: models.TextField = models.TextField()
    description_en: models.TextField = models.TextField()


class VotingMeasures(models.Model):
    value = models.CharField(max_length=255)
    description_pl = models.TextField()
    description_en = models.TextField()

    def __str__(self):
        return self.value

    @classmethod
    def validate(cls, project: Project, value: Optional[str]):
        if project.type_of_problem == Project.SURVIVAL:
            return
        if value is None:
            raise InvalidRequestException(
                "Voting measure has to be specified for classification and regression problems.")
        try:
            get_object_or_404(cls, value=value)
        except Http404:
            raise ValidationError(
                {"prediction_config": "Invalid voting measure."})


DEFAULT_VOTING_MEASURE = "Correlation"


class RuleSetImportAlgorithm(models.Model):
    PROBLEM_TYPE_CHOICES = [
        ("classification", "Classification"),
        ("regression", "Regression"),
        ("survival", "Survival"),
    ]

    name = models.CharField(max_length=100)
    implementation_url = models.URLField(blank=True, null=True)
    description_pl = models.TextField(blank=True, null=True)
    description_en = models.TextField(blank=True, null=True)
    supported_problem_types = ArrayField(
        models.CharField(max_length=20, choices=PROBLEM_TYPE_CHOICES),
        default=list
    )

    def __str__(self):
        return self.name
