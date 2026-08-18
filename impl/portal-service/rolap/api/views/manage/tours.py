from rest_framework.schemas.openapi import AutoSchema
from rest_framework.viewsets import ModelViewSet
from rolap.api.models import Tour
from rolap.api.permissions import IsRolapOperator
from rolap.api.serializers.tours import TourSerializer


class ToursViewSet(ModelViewSet):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['manage']

        def get_request_serializer(self, path, method):
            return TourSerializer()

        def get_response_serializer(self, path, method):
            return TourSerializer()

    schema = _CustomSchema(operation_id_base="tours")
    serializer_class = TourSerializer
    permission_classes = [IsRolapOperator, ]
    queryset = Tour.objects.all()
    pagination_class = None
    http_method_names = ["get", "post", "patch", "delete"]
