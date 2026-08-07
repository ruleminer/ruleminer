from rest_framework.generics import ListAPIView
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import SubscriptionPlan
from rolap.api.permissions import IsRolapUser
from rolap.api.serializers.plans import SubscriptionPlanListSerializer


class SubscriptionPlanListView(ListAPIView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ["user_limits"]

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return SubscriptionPlanListSerializer()

    schema = _CustomSchema(operation_id_base="subscription_plans_list")
    permission_classes = [IsRolapUser, ]
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanListSerializer
    pagination_class = None
