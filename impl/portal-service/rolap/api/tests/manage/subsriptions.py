from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient

from rolap.api.models import LimitGroup
from rolap.api.models import Subscription


class SubscriptionViewsTestCase(TestCase):
    def setUp(self):
        self.client: APIClient = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_OPERATOR_ROLE]
        self.limit_group = LimitGroup.objects.create(
            name="Default Limit Group",
            max_rows=100,
            max_columns=10,
            max_size=1000,
            max_sum_size=5000,
            max_projects=5,
            max_datasets=10,
            max_rulesets=3,
            max_reports=2,
            plan=None
        )

        self.test_subscription = {
            "user": self.user.id,
            "limit_group": self.limit_group.id,
            "subscription_id": "sub_12345",
            "start_date": "2025-02-14",
            "expiration_date": "2025-03-14",
            "email": "test@example.com"
        }
        self.updated_subscription_data = {
            "subscription_id": "sub_updated",
            "email": "updated@example.com"
        }

    def test_subscription_create(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("subscriptions-list")
        response = self.client.post(url, self.test_subscription, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Subscription.objects.count(), 1)
        subscription = Subscription.objects.get()
        self.assertEqual(subscription.subscription_id, "sub_12345")
        self.assertEqual(subscription.email, "test@example.com")

    def test_subscription_detail(self):
        self.client.force_authenticate(user=self.user)
        subscription = Subscription.objects.create(
            user=self.user,
            limit_group=self.limit_group,
            subscription_id="sub_12345",
            start_date="2025-02-14",
            expiration_date="2025-03-14",
            email="test@example.com"
        )
        url = reverse("subscriptions-detail", args=[subscription.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["subscription_id"], "sub_12345")
        self.assertEqual(response.data["email"], "test@example.com")

    def test_subscription_list(self):
        self.client.force_authenticate(user=self.user)
        Subscription.objects.create(
            user=self.user,
            limit_group=self.limit_group,
            subscription_id="sub_12345",
            start_date="2025-02-14",
            expiration_date="2025-03-14",
            email="test@example.com"
        )
        url = reverse("subscriptions-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["subscription_id"], "sub_12345")
        self.assertEqual(response.data[0]["email"], "test@example.com")

    def test_subscription_update(self):
        self.client.force_authenticate(user=self.user)
        subscription = Subscription.objects.create(
            user=self.user,
            limit_group=self.limit_group,
            subscription_id="sub_12345",
            start_date="2025-02-14",
            expiration_date="2025-03-14",
            email="test@example.com"
        )
        url = reverse("subscriptions-detail", args=[subscription.id])
        response = self.client.patch(
            url, self.updated_subscription_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        subscription.refresh_from_db()
        self.assertEqual(subscription.subscription_id, "sub_updated")
        self.assertEqual(subscription.email, "updated@example.com")

    def test_subscription_unauthorized(self):
        self.client.force_authenticate(user=self.user)
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.user.save()
        url = reverse("subscriptions-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_subscription_delete(self):
        self.client.force_authenticate(user=self.user)
        subscription = Subscription.objects.create(
            user=self.user,
            limit_group=self.limit_group,
            subscription_id="sub_12345",
            start_date="2025-02-14",
            expiration_date="2025-03-14",
            email="test@example.com"
        )
        url = reverse("subscriptions-detail", args=[subscription.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Subscription.objects.count(), 0)
