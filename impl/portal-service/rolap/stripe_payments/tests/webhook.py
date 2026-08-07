import json
from datetime import datetime
from datetime import timedelta
from datetime import timezone as tz
from unittest.mock import patch

import stripe
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from keycloak_auth.models import User
from rest_framework import status
from rolap.api.models import LimitGroup
from rolap.api.models import Subscription
from rolap.api.models import SubscriptionPlan


class StripeWebhookTests(TestCase):
    def setUp(self):
        self.url = reverse("stripe_webhook")
        self.signature_header = 'tst_signature'
        self.plan = SubscriptionPlan.objects.create(name="TEST_SUB")
        self.user = User.objects.create_user(
            keycloak_id=1, username="test", email="test@test.com", password="test",
        )
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
        start_date = timezone.now().date() - timedelta(days=30)
        expiration_date = timezone.now().date()
        self.subscription = Subscription.objects.create(
            user=self.user,
            limit_group=self.limit_group,
            subscription_id="sub_existing",
            start_date=start_date,
            expiration_date=expiration_date,
            email=self.user.email,
        )

    @patch('stripe.Webhook.construct_event')
    def test_new_subscription_creation(self, mock_construct_event):

        expires_at = int((timezone.now() + timedelta(days=30)).timestamp())
        payload = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "client_reference_id": self.user.id,
                    "customer_details": {"email": "test@example.com"},
                    "metadata": {"subscription_plan_id": self.plan.pk},
                    "subscription": "sub_test",
                    "expires_at": expires_at
                }
            }
        }

        mock_event = stripe.Event.construct_from(
            payload, stripe.api_key
        )
        mock_construct_event.return_value = mock_event

        response = self.client.post(
            self.url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE=self.signature_header
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Subscription.objects.filter(
            subscription_id="sub_test").exists())

        subscription = Subscription.objects.get(subscription_id="sub_test")
        expected_expiration_date = datetime.fromtimestamp(
            expires_at, tz=tz.utc
        ).astimezone(timezone.get_current_timezone()).date()
        self.assertEqual(subscription.expiration_date,
                         expected_expiration_date)

    @patch('stripe.Webhook.construct_event')
    def test_subscription_renewal(self, mock_construct_event):
        period_end = int((timezone.now() + timedelta(days=30)).timestamp())

        payload = {
            "type": "invoice.payment_succeeded",
            "data": {
                "object": {
                    "subscription": "sub_existing",
                    "lines": {
                        "data": [
                            {
                                "period": {
                                    "start": int(timezone.now().timestamp()),
                                    "end": period_end
                                }
                            }
                        ]
                    }
                }
            }
        }

        mock_event = stripe.Event.construct_from(
            payload, stripe.api_key
        )
        mock_construct_event.return_value = mock_event

        response = self.client.post(
            self.url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE=self.signature_header
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.subscription.refresh_from_db()

        expected_expiration_date = datetime.fromtimestamp(
            period_end, tz=tz.utc
        ).astimezone(timezone.get_current_timezone())

        self.assertEqual(self.subscription.expiration_date,
                         expected_expiration_date.date())
