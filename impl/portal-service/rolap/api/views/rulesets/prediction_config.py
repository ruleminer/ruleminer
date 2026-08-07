from dataclasses import asdict

from decision_rules.classification.ruleset import ClassificationRuleSet
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.regression.ruleset import RegressionRuleSet
from decision_rules.survival.ruleset import SurvivalRuleSet
from rest_framework import serializers
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models.algorithms import DEFAULT_VOTING_MEASURE
from rolap.api.models.algorithms import VotingMeasures
from rolap.api.models.projects import Project
from rolap.api.models.rulesets.rulesets import PredictionConfig
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.serializers.rulesets.prediction_config import PredictionConfigBooleanOption
from rolap.api.serializers.rulesets.prediction_config import PredictionConfigChoiceOption
from rolap.api.serializers.rulesets.prediction_config import PredictionConfigOptions
from rolap.api.serializers.rulesets.prediction_config import PredictionConfigOptionsSerializer
from rolap.api.serializers.rulesets.prediction_config import PredictionConfigurationSerializer
from rolap.api.views.base import ProjectBaseView
from rolap.api.views.base import RulesetBaseView


class PredictionConfigOptionsListView(ProjectBaseView):
    """List available options for different prediction config parameters
    which differ for different problem types
    """

    lookup_url_kwarg = 'project_id'
    pagination_class = None
    serializer_class = PredictionConfigOptionsSerializer
    action = 'retrieve'

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['prediction_config']

        def get_response_serializer(self, path, method):
            return PredictionConfigOptionsSerializer()

    schema = _CustomSchema(operation_id_base="get_prediction_config_options")

    def _get_prediction_strategies_options(self, problem_type: str) -> PredictionConfigChoiceOption:
        ruleset_instance: AbstractRuleSet = {
            Project.CLASSIFICATION: lambda: ClassificationRuleSet(rules=[]),
            Project.REGRESSION: lambda: RegressionRuleSet(rules=[]),
            Project.SURVIVAL: lambda: SurvivalRuleSet(rules=[], survival_time_attr=None),
        }[problem_type]()
        possible_strategies: dict = ruleset_instance.prediction_strategies_choice
        default_strategy: str = {
            value: key for key, value in possible_strategies.items()
        }[ruleset_instance.get_default_prediction_strategy_class()]
        prediction_strategy_choices: list[str] = list(
            ruleset_instance.prediction_strategies_choice.keys()
        )
        return PredictionConfigChoiceOption(
            choices=prediction_strategy_choices,
            default=default_strategy
        )

    def _get_use_default_rule_options(self) -> PredictionConfigBooleanOption:
        return PredictionConfigBooleanOption(
            default=True  # default rule is enabled by default
        )

    def _get_voting_measure_options(self) -> PredictionConfigChoiceOption:
        choices = VotingMeasures.objects.values_list("value", flat=True)
        return PredictionConfigChoiceOption(
            choices=choices,
            default=DEFAULT_VOTING_MEASURE)

    def get(self, request: Request, **kwargs) -> Response:
        project: Project = self.get_object()
        problem_type = project.type_of_problem
        prediction_strategies: PredictionConfigChoiceOption = self._get_prediction_strategies_options(
            problem_type)
        use_default_rule: PredictionConfigBooleanOption = self._get_use_default_rule_options()
        if problem_type != Project.SURVIVAL:
            voting_measure: PredictionConfigChoiceOption = self._get_voting_measure_options(
            )
        else:
            voting_measure = None
        data = PredictionConfigOptions(
            prediction_strategy=prediction_strategies,
            use_default_rule=use_default_rule,
            voting_measure=voting_measure
        )
        serializer: serializers.Serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class PredictionConfigView(RulesetBaseView):
    """
    Fetch ruleset prediction configuration.
    Update can only be performed by overwriting the ruleset.
    """
    lookup_url_kwarg = 'ruleset_id'
    pagination_class = None
    serializer_class = PredictionConfigurationSerializer
    action = 'retrieve'

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['prediction_config']

        def get_response_serializer(self, path, method):
            return PredictionConfigurationSerializer(many=False)

        def get_operation_id(self, path, method):
            return f'{method}_ruleset_prediction_config'

    schema = _CustomSchema()

    def get(self, request: Request, **kwargs) -> Response:
        """Retrieve ruleset prediction configuration
        """
        ruleset: Ruleset = self.get_object()
        prediction_config: PredictionConfig = ruleset.prediction_config
        serializer: PredictionConfigurationSerializer = self.get_serializer(
            data=asdict(prediction_config)
        )
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
