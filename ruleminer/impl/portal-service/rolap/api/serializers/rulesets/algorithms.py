from rest_framework import serializers
from rolap.api.models import Algorithm
from rolap.api.models.algorithms import Answer
from rolap.api.models.algorithms import NAAlgorithmParameters
from rolap.api.models.algorithms import Question
from rolap.api.serializers.algorithms import AlgorithmParamsSerializer


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ('answer_number', 'answer_text_pl',
                  'answer_text_en', 'next_question_number')


class QuestionSerializer(serializers.ModelSerializer):
    question_answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('question_number', 'algorithm',
                  'question_text_pl', 'question_text_en', 'question_answers')


class RequestNAAlgorithmParametersSerializer(serializers.Serializer):
    answers = serializers.DictField()
    extra_values = serializers.DictField(required=False, default={})


class NAAlgorithmParametersSerializer(serializers.ModelSerializer):
    algorithm_name = serializers.CharField(source="algorithm.name")

    class Meta:
        model = NAAlgorithmParameters
        fields = ('id', 'algorithm_name', 'answer_string', 'params_json')


class AlgorithmDetailPreviewSerializer(serializers.ModelSerializer):
    parameters = AlgorithmParamsSerializer(many=True)
    expert_parameters = AlgorithmParamsSerializer(many=True)

    class Meta:
        model = Algorithm
        fields = ["id", "name", "version", "description_pl", "description_en",
                  "parameters", "expert_parameters", ]


class AlgorithmListPreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Algorithm
        fields = ["id", "name", "version",
                  "description_pl", "description_en", "na_generation", "expert_induction"]
