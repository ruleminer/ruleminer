from datetime import timedelta

from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models import LimitGroup
from rolap.api.models import Subscription
from rolap.api.models import SubscriptionPlan


class LimitGroupViewsTestCase(TestCase):
    def setUp(self):
        self.client: APIClient = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_OPERATOR_ROLE]
        self.test_plan = SubscriptionPlan.objects.create(name="test_plan")
        self.test_limit_group = {
            "name": "test_limit_group",
            "max_rows": 10,
            "max_columns": 10,
            "max_size": 10,
            "max_sum_size": 1000,
            "max_projects": 10,
            "max_datasets": 10,
            "max_rulesets": 10,
            "max_reports": 10,
            "plan": self.test_plan,
        }

    def test_limit_group_create(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("limit-groups-list")
        body = self.test_limit_group
        body["plan"] = self.test_plan.id
        response = self.client.post(url, body, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(LimitGroup.objects.count(), 1)
        self.assertEqual(LimitGroup.objects.get().name, "test_limit_group")

    def test_limit_group_detail(self):
        self.client.force_authenticate(user=self.user)
        limit_group = LimitGroup.objects.create(**self.test_limit_group)
        url = reverse("limit-groups-detail", args=[limit_group.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "test_limit_group")

    def test_limit_group_list(self):
        self.client.force_authenticate(user=self.user)
        LimitGroup.objects.create(**self.test_limit_group)
        url = reverse("limit-groups-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["name"], "test_limit_group")
        self.assertEqual(len(response.data), 1)

    def test_limit_group_update(self):
        self.client.force_authenticate(user=self.user)
        limit_group = LimitGroup.objects.create(**self.test_limit_group)
        url = reverse("limit-groups-detail", args=[limit_group.id])
        response = self.client.patch(url, {"name": "new_name"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "new_name")

    def test_limit_group_unauthorized(self):
        self.client.force_authenticate(user=self.user)
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.user.save()
        url = reverse("limit-groups-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_limit_group_delete(self):
        self.client.force_authenticate(user=self.user)
        limit_group = LimitGroup.objects.create(**self.test_limit_group)
        url = reverse("limit-groups-detail", args=[limit_group.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(LimitGroup.objects.count(), 0)


class UserLimitsViewTestCase(TestCase):
    def setUp(self):
        self.client: APIClient = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.rolap = self.create_rolap_user_limits()
        self.premium = self.create_premium_limits()
        self.demo = self.create_demo_limits()

    def test_user_limits_default(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse("user_limits"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data["max_rows"], self.rolap.max_rows)
        self.assertEqual(data["max_columns"], self.rolap.max_columns)
        self.assertEqual(data["max_size"], self.rolap.max_size)
        self.assertEqual(data["max_sum_size"], self.rolap.max_sum_size)

    def test_user_limits_premium(self):
        start_date = timezone.now().date()
        expiration_date = start_date + timedelta(days=30)
        Subscription.objects.create(
            user=self.user,
            limit_group=self.premium,
            subscription_id="sub_id",
            start_date=start_date,
            expiration_date=expiration_date,
            email="example@gmail.com",
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse("user_limits"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data["max_rows"], self.premium.max_rows)
        self.assertEqual(data["max_columns"], self.premium.max_columns)
        self.assertEqual(data["max_size"], self.premium.max_size)
        self.assertEqual(data["max_sum_size"], self.premium.max_sum_size)

    def test_user_limits_demo(self):
        start_date = timezone.now().date()
        expiration_date = start_date + timedelta(days=30)
        Subscription.objects.create(
            user=self.user,
            limit_group=self.demo,
            subscription_id="sub_id",
            start_date=start_date,
            expiration_date=expiration_date,
            email="example@gmail.com",
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse("user_limits"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data["max_rows"], self.demo.max_rows)
        self.assertEqual(data["max_columns"], self.demo.max_columns)
        self.assertEqual(data["max_size"], self.demo.max_size)
        self.assertEqual(data["max_sum_size"], self.demo.max_sum_size)

    def test_user_limits_demo_and_premium(self):
        start_date = timezone.now().date()
        expiration_date = start_date + timedelta(days=30)
        Subscription.objects.create(
            user=self.user,
            limit_group=self.demo,
            subscription_id="sub_id_demo",
            start_date=start_date,
            expiration_date=expiration_date,
            email="example@gmail.com",
        )
        Subscription.objects.create(
            user=self.user,
            limit_group=self.premium,
            subscription_id="sub_id_premium",
            start_date=start_date,
            expiration_date=expiration_date,
            email="example@gmail.com",
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse("user_limits"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data["max_rows"], self.premium.max_rows)
        self.assertEqual(data["max_columns"], self.premium.max_columns)
        self.assertEqual(data["max_size"], self.premium.max_size)
        self.assertEqual(data["max_sum_size"], self.premium.max_sum_size)

    def test_user_subscription_limits_expired(self):
        start_date = timezone.now().date() - timedelta(days=60)
        expiration_date = start_date + timedelta(days=30)
        Subscription.objects.create(
            user=self.user,
            limit_group=self.premium,
            subscription_id="sub_id_expired",
            start_date=start_date,
            expiration_date=expiration_date,
            email="expired@example.com",
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse("user_limits"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data["max_rows"], self.rolap.max_rows)
        self.assertEqual(data["max_columns"], self.rolap.max_columns)
        self.assertEqual(data["max_size"], self.rolap.max_size)
        self.assertEqual(data["max_sum_size"], self.rolap.max_sum_size)

    def create_rolap_user_limits(self):
        rolap = LimitGroup.objects.create(
            name=settings.KEYCLOAK_USER_ROLE,
            max_rows=1000,
            max_columns=25,
            max_size=100 * 1024 * 1024,
            max_sum_size=1000 * 1024 * 1024,
            max_projects=100,
            max_datasets=100,
            max_rulesets=100,
            max_reports=100,
        )
        return rolap

    def create_premium_limits(self):
        premium = LimitGroup.objects.create(
            name="storage_premium",
            max_rows=10000,
            max_columns=100,
            max_size=500 * 1024 * 1024,
            max_sum_size=5000 * 1024 * 1024,
            max_projects=1000,
            max_datasets=1000,
            max_rulesets=1000,
            max_reports=1000,
        )
        return premium

    def create_demo_limits(self):
        demo = LimitGroup.objects.create(
            name="storage_demo",
            max_rows=100,
            max_columns=10,
            max_size=10 * 1024 * 1024,
            max_sum_size=100 * 1024 * 1024,
            max_projects=10,
            max_datasets=10,
            max_rulesets=10,
            max_reports=10,
        )
        return demo
