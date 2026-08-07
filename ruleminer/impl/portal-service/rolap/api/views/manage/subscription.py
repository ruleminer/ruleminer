from rest_framework.schemas.openapi import AutoSchema
from rest_framework.viewsets import ModelViewSet
from rolap.api.models import Subscription
from rolap.api.permissions import IsRolapOperator
from rolap.api.serializers.subscription import SubscriptionSerializer


class SubscriptionViewSet(ModelViewSet):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['manage']

        def get_request_serializer(self, path, method):
            return SubscriptionSerializer()

        def get_response_serializer(self, path, method):
            return SubscriptionSerializer()

    schema = _CustomSchema(operation_id_base="subscriptions")
    serializer_class = SubscriptionSerializer
    permission_classes = [IsRolapOperator, ]
    queryset = Subscription.objects.all()
    pagination_class = None
    http_method_names = ["get", "post", "patch", "delete"]
