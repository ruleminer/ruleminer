from rest_framework import mixins
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet
from rolap.api.models.algorithms import Algorithm
from rolap.api.models.algorithms import NAAlgorithmParameters
from rolap.api.models.algorithms import Question
from rolap.api.models.algorithms import VotingMeasures
from rolap.api.models.algorithms import RuleSetImportAlgorithm
from rolap.api.permissions import IsRolapOperator
from rolap.api.serializers.algorithms import ManageAlgorithmSerializer
from rolap.api.serializers.algorithms import ManageNAAlgorithmParametersSerializer
from rolap.api.serializers.algorithms import ManageQuestionSerializer
from rolap.api.serializers.algorithms import ManageVotingMeasuresSerializer
from rolap.api.serializers.algorithms import RuleSetImportAlgorithmSerializer


class ManageAlgorithmView(mixins.CreateModelMixin, mixins.RetrieveModelMixin, GenericViewSet):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['manage']

        def get_request_serializer(self, path, method):
            return ManageAlgorithmSerializer()

        def get_response_serializer(self, path, method):
            return ManageAlgorithmSerializer()

    schema = _CustomSchema(operation_id_base="manage_algorithm")
    permission_classes = [IsRolapOperator, ]
    queryset = Algorithm.objects.all()
    serializer_class = ManageAlgorithmSerializer


class ManageQuestionView(RetrieveUpdateAPIView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['manage']

        def get_request_serializer(self, path, method):
            return ManageQuestionSerializer()

        def get_response_serializer(self, path, method):
            return ManageQuestionSerializer()

    schema = _CustomSchema(operation_id_base="manage_question")
    permission_classes = [IsRolapOperator, ]
    queryset = Question.objects.all()
    serializer_class = ManageQuestionSerializer


class ManageNAAlgorithmParametersView(RetrieveUpdateAPIView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['manage']

        def get_request_serializer(self, path, method):
            return ManageNAAlgorithmParametersSerializer()

        def get_response_serializer(self, path, method):
            return ManageNAAlgorithmParametersSerializer()

    schema = _CustomSchema(operation_id_base="manage_na_algorithm_parameters")
    permission_classes = [IsRolapOperator, ]
    queryset = NAAlgorithmParameters.objects.all()
    serializer_class = ManageNAAlgorithmParametersSerializer


class ManageVotingMeasuresView(APIView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['manage']

        def get_request_serializer(self, path, method):
            return ManageVotingMeasuresSerializer()

        def get_response_serializer(self, path, method):
            return ManageVotingMeasuresSerializer()

    schema = _CustomSchema(operation_id_base="add_voting_measures")
    permission_classes = [IsRolapOperator, ]

    def post(self, request, *args, **kwargs):
        serializer = ManageVotingMeasuresSerializer(
            data=request.data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        ids = request.data.get('ids', [])
        try:
            VotingMeasures.objects.filter(id__in=ids).delete()
            return Response({"status": "success", "message": "Objects deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ManageRuleSetImportAlgorithmView(APIView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['manage']

        def get_request_serializer(self, path, method):
            return RuleSetImportAlgorithmSerializer()

        def get_response_serializer(self, path, method):
            return RuleSetImportAlgorithmSerializer()

    schema = _CustomSchema(operation_id_base="manage_ruleset_import_algorithm")
    permission_classes = [IsRolapOperator, ]

    def post(self, request, *args, **kwargs):
        serializer = RuleSetImportAlgorithmSerializer(
            data=request.data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        ids = request.data.get('ids', [])
        try:
            RuleSetImportAlgorithm.objects.filter(id__in=ids).delete()
            return Response({"status": "success", "message": "Objects deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
