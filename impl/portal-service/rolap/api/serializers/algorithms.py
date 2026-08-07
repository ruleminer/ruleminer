from typing import OrderedDict

from decision_rules.helpers import get_measure_function_by_name
from django.db import transaction
from rest_framework import serializers
from rolap.api.models.algorithms import Algorithm
from rolap.api.models.algorithms import AlgorithmParams
from rolap.api.models.algorithms import Answer
from rolap.api.models.algorithms import NAAlgorithmParameters
from rolap.api.models.algorithms import ParamsChoiceValues
from rolap.api.models.algorithms import Question
from rolap.api.models.algorithms import RuleSetImportAlgorithm
from rolap.api.models.algorithms import VotingMeasures
from rolap.api.models.rulesets.rulesets_db import MEASURES_PARAMETERS_NAME


class ParamsChoiceValuesSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParamsChoiceValues
        exclude = ["id", ]
        read_only_fields = ["algorithm_params"]


class AlgorithmParamsSerializer(serializers.ModelSerializer):
    parameter_values = ParamsChoiceValuesSerializer(many=True, required=False)

    class Meta:
        model = AlgorithmParams
        fields = "__all__"
        read_only_fields = ["algorithm", ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if not representation["parameter_values"]:
            representation.pop("parameter_values")
        return representation


class ManageAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = "__all__"
        extra_kwargs = {
            'question': {'read_only': True}
        }


class ManageQuestionSerializer(serializers.ModelSerializer):
    question_answers = ManageAnswerSerializer(many=True)

    class Meta:
        model = Question
        fields = "__all__"
        extra_kwargs = {
            'algorithm': {'read_only': True}
        }


class ManageNAAlgorithmParametersSerializer(serializers.ModelSerializer):
    class Meta:
        model = NAAlgorithmParameters
        fields = "__all__"
        extra_kwargs = {
            'algorithm': {'read_only': True}
        }


class ManageAlgorithmSerializer(serializers.ModelSerializer):
    parameters = AlgorithmParamsSerializer(many=True)
    expert_parameters = AlgorithmParamsSerializer(many=True, default=[])
    questions = ManageQuestionSerializer(many=True)
    na_algorithm_parameters = ManageNAAlgorithmParametersSerializer(many=True)

    class Meta:
        model = Algorithm
        fields = "__all__"

    def _validate_measure_parameter(self, parameter_name: str, parameter_value: str):
        if parameter_value is None:
            raise serializers.ValidationError({
                'parameters': (
                    f'"None value for parameter "{parameter_name}".'
                    + f'Value: "{parameter_value}" is not a name of measure' +
                    ' supported by decision_rules package.'
                )
            })
        try:
            _ = get_measure_function_by_name(parameter_value)
        except ValueError as e:
            # measure not supported
            raise serializers.ValidationError({
                'parameters': (
                    f'"Not supported value for parameter "{parameter_name}".'
                    + f'Value: "{parameter_value}" is not a name of measure' +
                    ' supported by decision_rules package.'
                )
            }) from e

    def validate_parameters(self, parameters: list[OrderedDict]):
        for param in parameters:
            if param.get('name') in MEASURES_PARAMETERS_NAME:
                if param.get('parameter_type') != 'choice':
                    raise serializers.ValidationError({
                        'parameters': (
                            f'Parameter "{param.get("name")}" should be of type "choice"' +
                            f' but is of type "{param.get("parameter_type")}".'
                        )
                    })
                self._validate_measure_parameter(
                    param.get('name'),
                    param.get('default_value')
                )
                for item in param.get('parameter_values', []):
                    self._validate_measure_parameter(
                        param.get('name'),
                        item.get('value')
                    )
        return super().validate(parameters)

    def create(self, validated_data):
        with transaction.atomic():
            params: list = validated_data.pop("parameters", [])
            expert_params: list = validated_data.pop("expert_parameters", [])
            if not expert_params:
                expert_params = []
                validated_data['expert_induction'] = False
            questions: list = validated_data.pop("questions", [])
            na_params: list = validated_data.pop("na_algorithm_parameters", [])
            if not questions or not na_params:
                questions = []
                na_params = []
                validated_data['na_generation'] = False
            algorithm: Algorithm = super().create(validated_data)
            for param in params:
                self.create_params(algorithm, param, False)
            for expert_param in expert_params:
                self.create_params(algorithm, expert_param, True)
            for question in questions:
                self.create_question(algorithm, question)
            for na_param in na_params:
                self.create_na_params(algorithm, na_param)
            return algorithm

    def create_params(self, algorithm, param_data, is_expert):
        param_choices: list = param_data.pop("parameter_values", [])
        db_param: AlgorithmParams = AlgorithmParams.objects.create(
            algorithm=algorithm, expert_induction=is_expert, **param_data)
        for param_choice in param_choices:
            ParamsChoiceValues.objects.create(
                algorithm_params=db_param, **param_choice)

    def create_question(self, algorithm, question_data):
        answers: list = question_data.pop("question_answers", [])
        db_question: Question = Question.objects.create(
            algorithm=algorithm, **question_data)
        for answer in answers:
            Answer.objects.create(question=db_question, **answer)

    def create_na_params(self, algorithm, na_param_data):
        NAAlgorithmParameters.objects.create(
            algorithm=algorithm, **na_param_data)


class ManageVotingMeasuresSerializer(serializers.ModelSerializer):
    class Meta:
        model = VotingMeasures
        fields = '__all__'


class RuleSetImportAlgorithmSerializer(serializers.ModelSerializer):
    class Meta:
        model = RuleSetImportAlgorithm
        fields = '__all__'
