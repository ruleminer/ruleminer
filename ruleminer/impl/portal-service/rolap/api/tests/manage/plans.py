from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models import SubscriptionPlan


class SubscriptionPlanViewsTestCase(TestCase):
    def setUp(self):
        self.client: APIClient = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_OPERATOR_ROLE]
        self.test_subscription_plan = {
            "name": "FREE",
            "payment_link": None
        }
        self.payment_link = "https://example.com/update"

    def test_subscription_plan_create(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("subscription-plans-list")
        response = self.client.post(
            url, self.test_subscription_plan, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SubscriptionPlan.objects.count(), 1)
        self.assertEqual(SubscriptionPlan.objects.get().name, "FREE")
        self.assertIsNone(SubscriptionPlan.objects.get().payment_link)

    def test_subscription_plan_detail(self):
        self.client.force_authenticate(user=self.user)
        subscription_plan = SubscriptionPlan.objects.create(
            **self.test_subscription_plan)
        url = reverse("subscription-plans-detail", args=[subscription_plan.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "FREE")
        self.assertIsNone(response.data.get("payment_link"))

    def test_subscription_plan_list(self):
        self.client.force_authenticate(user=self.user)
        SubscriptionPlan.objects.create(**self.test_subscription_plan)
        url = reverse("subscription-plans-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["name"], "FREE")
        self.assertIsNone(response.data[0]["payment_link"])
        self.assertEqual(len(response.data), 1)

    def test_subscription_plan_update(self):
        self.client.force_authenticate(user=self.user)
        subscription_plan = SubscriptionPlan.objects.create(
            **self.test_subscription_plan)
        url = reverse("subscription-plans-detail", args=[subscription_plan.id])
        update_data = {"name": "new_name",
                       "payment_link": self.payment_link}
        response = self.client.patch(url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        updated_plan = SubscriptionPlan.objects.get(id=subscription_plan.id)
        self.assertEqual(updated_plan.name, "new_name")
        self.assertEqual(updated_plan.payment_link,
                         self.payment_link)

    def test_subscription_plan_unauthorized(self):
        self.client.force_authenticate(user=self.user)
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.user.save()
        url = reverse("subscription-plans-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_subscription_plan_delete(self):
        self.client.force_authenticate(user=self.user)
        subscription_plan = SubscriptionPlan.objects.create(
            **self.test_subscription_plan)
        url = reverse("subscription-plans-detail", args=[subscription_plan.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(SubscriptionPlan.objects.count(), 0)
