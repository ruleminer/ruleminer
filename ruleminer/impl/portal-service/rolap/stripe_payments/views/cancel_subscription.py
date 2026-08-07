import os

import stripe
from rest_framework import status
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.views import APIView
from rolap.api.models import Subscription
from rolap.api.permissions import IsRolapUser


stripe.api_key = os.environ["STRIPE_TEST_SECRET"]


class CancelSubscriptionView(APIView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['subscriptions']

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="cancel_subscription")
    permission_classes = [IsRolapUser, ]

    def post(self, request, *args, **kwargs):
        user = request.user
        try:
            subscription = Subscription.objects.get(user=user)
        except Subscription.DoesNotExist:
            return Response({'error': 'No subscription found for this user.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            stripe.Subscription.modify(
                subscription.subscription_id, cancel_at_period_end=True,)
        except stripe.error.StripeError:
            return Response({'error': 'Failed to cancel subscription in Stripe.'}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({'message': 'Subscription cancelled successfully.'}, status=status.HTTP_200_OK)
