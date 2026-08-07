from rest_framework.generics import ListAPIView
from rest_framework.schemas.openapi import AutoSchema
from rolap.api import exceptions
from rolap.api.models import IndicatorMeta
from rolap.api.models import Project
from rolap.api.permissions import IsRolapUser
from rolap.api.serializers.indicators import IndicatorMetaSerializer


class IndicatorsMetaView(ListAPIView):
    """List meta data about all possible rules indicators for given project type
    """

    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['indicators_meta']

        def get_response_serializer(self, path, method):
            return IndicatorMetaSerializer(many=True)

    schema = _CustomSchema(operation_id_base="indicators_meta")
    serializer_class = IndicatorMetaSerializer
    pagination_class = None  # for returning primitive list
    permission_classes = [IsRolapUser, ]

    def _validate_type_of_problem(self, type_of_problem: str):
        if type_of_problem not in [e[0] for e in Project.TYPE_OF_PROBLEM_CHOICES]:
            raise exceptions.UnsupportedProblemTypeException(type_of_problem)

    def get_queryset(self):
        type_of_problem: str = self.request.GET.get('type_of_problem')
        if type_of_problem is not None:
            self._validate_type_of_problem(type_of_problem)
            return IndicatorMeta.objects.get_for_problem_type(type_of_problem)
        return IndicatorMeta.objects.all()
