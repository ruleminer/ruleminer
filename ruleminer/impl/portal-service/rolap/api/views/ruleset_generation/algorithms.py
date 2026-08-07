from django.db.models import F
from django.db.models import Max
from django.db.models import Window
from django.http import Http404
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.generics import RetrieveAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import AlgorithmNotFoundException
from rolap.api.exceptions import MissingParameterException
from rolap.api.models.algorithms import Algorithm
from rolap.api.permissions import IsRolapUser
from rolap.api.serializers.rulesets.algorithms import AlgorithmDetailPreviewSerializer
from rolap.api.serializers.rulesets.algorithms import AlgorithmListPreviewSerializer
from rolap.api.serializers.rulesets.algorithms import NAAlgorithmParametersSerializer
from rolap.api.serializers.rulesets.algorithms import QuestionSerializer
from rolap.api.utils.factories import AlgorithmParametersFactory
from rolap.api.views.base import DatasetBaseView


class AlgorithmsView(ListAPIView):

    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['ruleset_generation']

        def get_response_serializer(self, path, method):
            return AlgorithmListPreviewSerializer()

        def get_operation(self, path, method):
            op = super().get_operation(path, method)
            op['parameters'].append(
                {"name": "problem", "in": "query", "required": True, "schema": {"type": "string"}})
            return op

    schema = _CustomSchema(operation_id_base="algorithm_list")
    permission_classes = [IsRolapUser, ]

    serializer_class = AlgorithmListPreviewSerializer
    pagination_class = None

    def get_queryset(self):
        if "problem" not in self.request.query_params:
            raise MissingParameterException(missing_label="problem")
        problem_type = self.request.query_params["problem"]
        queryset = Algorithm.objects.filter(problem_type=problem_type)
        queryset = queryset.annotate(
            latest_version=Window(expression=Max(
                "version"), partition_by=[F("name")])
        )
        queryset = queryset.filter(version=F("latest_version"))
        if not queryset.count():
            raise AlgorithmNotFoundException(
                "Could not find any algorithms for this type of problem.")
        return queryset.order_by('pk')


class AlgorithmDetailView(RetrieveAPIView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['ruleset_generation']

        def get_response_serializer(self, path, method):
            return AlgorithmDetailPreviewSerializer()

    schema = _CustomSchema(operation_id_base="algorithm_detail")
    serializer_class = AlgorithmDetailPreviewSerializer
    lookup_url_kwarg = "algorithm_id"
    queryset = Algorithm.objects.all()
    permission_classes = [IsRolapUser, ]

    def get_object(self):
        try:
            return super().get_object()
        except Http404:
            raise AlgorithmNotFoundException()


class QuestionListView(RetrieveAPIView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['ruleset_generation']

        def get_response_serializer(self, path, method):
            return QuestionSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="question_list")
    lookup_field = "pk"
    lookup_url_kwarg = "algorithm_id"
    queryset = Algorithm.objects.all()
    permission_classes = [IsRolapUser, ]

    def get(self, *args, **kwargs) -> Response:
        """HTTP GET method to retrieve questions with their answers for a specific algorithm.

        Returns:
            Response: A Response object containing the question data in JSON format.
        """
        algorithm = self.get_object()
        questions = algorithm.questions.all()
        if not questions:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)


class NAAlgorithmParametersView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['ruleset_generation']

        def get_response_serializer(self, path, method):
            return NAAlgorithmParametersSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema("na_algorithm_parameters")
    permission_classes = [IsRolapUser, ]

    def post(self, request: Request, algorithm_id: int, dataset_id: int, *args, **kwargs) -> Response:
        """HTTP POST method to retrieve algorithm parameters based on the given answers.
        Args:
            request (Request):  Dictionary in which the keys are question numbers, and the values are the corresponding answer numbers that have been given to those questions.
                                    Example:
                                    {
                                    "answers": {
                                        "1":"3",
                                        "2":"3",
                                        "3":"2",
                                        "4":"2"

                                    },
                                    "extra_values":{
                                    "prct_of_noise": 0.1,
                                    }
                                    }
            algorithm_id (int): The ID of the algorithm for which to retrieve the parameters.
            dataset_id (int): The ID of the dataset for which to retrieve the parameters.

        Raises:
            NotFound: If the algorithm parameters for the provided answers do not exist in the database.

        Returns:
            Response: A Response object containing the algorithm parameters data in JSON format
        """
        dataset = self.get_object()
        try:
            algorithm = Algorithm.objects.get(pk=algorithm_id)
        except Algorithm.DoesNotExist:
            return Response(
                {'detail': "Algorithm does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        params_factory = AlgorithmParametersFactory(
            dataset=dataset,
            algorithm=algorithm,
        )
        params_data = params_factory.get_from_survey(request.data)

        return Response(params_data)
