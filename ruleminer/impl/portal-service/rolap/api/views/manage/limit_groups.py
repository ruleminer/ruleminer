from rest_framework.schemas.openapi import AutoSchema
from rest_framework.viewsets import ModelViewSet
from rolap.api.models import LimitGroup
from rolap.api.permissions import IsRolapOperator
from rolap.api.serializers.limits import LimitGroupSerializer


class LimitGroupViewSet(ModelViewSet):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['manage']

        def get_request_serializer(self, path, method):
            return LimitGroupSerializer()

        def get_response_serializer(self, path, method):
            return LimitGroupSerializer()

    schema = _CustomSchema(operation_id_base="limit_groups")
    serializer_class = LimitGroupSerializer
    queryset = LimitGroup.objects.all()
    permission_classes = [IsRolapOperator, ]
    pagination_class = None
    http_method_names = ["get", "post", "patch", "delete"]
