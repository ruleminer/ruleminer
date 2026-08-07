import json
from datetime import timedelta
from unittest import mock

import stripe
from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models import LimitGroup
from rolap.api.models import Subscription
from rolap.api.models import SubscriptionPlan


class CancelSubscriptionTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.plan = SubscriptionPlan.objects.create(name="TEST_SUB")
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.limit_group = LimitGroup.objects.create(
            name="TEST_SUB",
            max_rows=5,
            max_columns=5,
            max_size=100 * 1024,
            max_sum_size=1000 * 1024,
            max_projects=10,
            max_datasets=10,
            max_rulesets=10,
            max_reports=10,
            plan=self.plan,
        )
        start_date = timezone.now().date() - timedelta(days=15)
        expiration_date = timezone.now().date() + timedelta(days=15)
        self.subscription = Subscription.objects.create(
            user=self.user,
            limit_group=self.limit_group,
            subscription_id="sub_test123",
            start_date=start_date,
            expiration_date=expiration_date,
            email=self.user.email,
        )
        self.url = reverse('cancel-subscription')

    @mock.patch('stripe.Subscription.modify')
    def test_cancel_subscription_success(self, mock_modify):
        mock_modify.return_value = {
            'id': self.subscription.subscription_id, 'canceled_at': 'timestamp'}
        self.client.force_authenticate(self.user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(json.loads(response.content), {
                         'message': 'Subscription cancelled successfully.'})

    @mock.patch('stripe.Subscription.modify')
    def test_subscription_not_found(self, mock_modify):
        Subscription.objects.all().delete()
        self.client.force_authenticate(self.user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(json.loads(response.content), {
                         'error': 'No subscription found for this user.'})

    @mock.patch('stripe.Subscription.modify')
    def test_stripe_error(self, mock_modify):
        mock_modify.side_effect = stripe.error.StripeError(
            "Failed to cancel subscription in Stripe.")
        self.client.force_authenticate(self.user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(json.loads(response.content), {
                         'error': 'Failed to cancel subscription in Stripe.'})
