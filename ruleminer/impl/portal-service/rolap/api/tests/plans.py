from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models import SubscriptionPlan


class SubscriptionPlanListTestCase(TestCase):
    def setUp(self):
        self.client: APIClient = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.payment_link = "https://example.com/pay"
        self.plan1 = SubscriptionPlan.objects.create(name="FREE")
        self.plan2 = SubscriptionPlan.objects.create(
            name="CUSTOM", payment_link=self.payment_link)

    def test_subscription_plan_list(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("subscription_plans_list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_response = [
            {'name': 'FREE', 'payment_link': None},
            {'name': 'CUSTOM', 'payment_link': self.payment_link}
        ]
        self.assertCountEqual(response.json(), expected_response)

    def test_subscription_plan_list_unauthorized(self):
        url = reverse("subscription_plans_list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_subscription_plan_list_forbidden(self):
        self.user._permissions = [settings.KEYCLOAK_OPERATOR_ROLE]
        self.client.force_authenticate(user=self.user)
        url = reverse("subscription_plans_list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
