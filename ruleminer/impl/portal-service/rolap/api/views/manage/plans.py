from rest_framework.schemas.openapi import AutoSchema
from rest_framework.viewsets import ModelViewSet
from rolap.api.models import SubscriptionPlan
from rolap.api.permissions import IsRolapOperator
from rolap.api.serializers.plans import SubscriptionPlanSerializer


class SubscriptionPlanViewSet(ModelViewSet):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['manage']

        def get_request_serializer(self, path, method):
            return SubscriptionPlanSerializer()

        def get_response_serializer(self, path, method):
            return SubscriptionPlanSerializer()

    schema = _CustomSchema(operation_id_base="subscription_plans")
    serializer_class = SubscriptionPlanSerializer
    queryset = SubscriptionPlan.objects.all()
    permission_classes = [IsRolapOperator, ]
    pagination_class = None
    http_method_names = ["get", "post", "patch", "delete"]
