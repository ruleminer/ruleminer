from datetime import timedelta
from unittest.mock import patch

from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models import LimitGroup, Subscription
from rolap.api.models import SubscriptionPlan
from keycloak_auth.backend import KeycloakAuthBackend
from stripe import Subscription as StripeSubscription


class UserInfoViewTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.plan = SubscriptionPlan.objects.create(
            name="TEST_PLAN",
        )
        self.limit_group = LimitGroup.objects.create(
            name="TEST_LIMIT_GROUP",
            max_rows=100,
            max_columns=100,
            max_size=100,
            max_sum_size=100,
            max_projects=100,
            max_datasets=100,
            max_rulesets=100,
            max_reports=100,
            plan=self.plan
        )
        self.subscription = Subscription.objects.create(
            user=self.user,
            limit_group=self.limit_group,
            subscription_id="1",
            start_date=timezone.now(),
            expiration_date=timezone.now() + timedelta(days=30),
        )

    def test_get_user_info(self):
        url = reverse("user_info")
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["current_limits"]['max_rows'], 100)
        self.assertEqual(response.data["plan"], self.plan.name)


class UserLanguageViewTests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]

    def test_get_preferred_language(self):
        url = reverse("user_language")
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['preferred_language'], None)

    def test_put_preferred_language(self):
        url = reverse("user_language")
        self.client.force_authenticate(self.user)
        data = {'preferred_language': 'pl'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.preferred_language, 'pl')

    def test_put_preferred_language_incorrect_value(self):
        url = reverse("user_language")
        self.client.force_authenticate(self.user)
        data = {'preferred_language': 'es'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_preferred_language(self):
        self.user.preferred_language = 'en'
        self.user.save()
        data = {'preferred_language': 'pl'}
        url = reverse("user_language")
        self.client.force_authenticate(self.user)
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.preferred_language, 'pl')


class DeleteSelfViewTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='keycloak123', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.limit_group = LimitGroup.objects.create(
            name="Test Limit Group",
            max_rows=1000,
            max_columns=100,
            max_size=1000,
            max_sum_size=10000,
            max_projects=10,
            max_datasets=50,
            max_rulesets=20,
            max_reports=30,
        )
        self.subscription = Subscription.objects.create(
            user=self.user,
            subscription_id="sub_123",
            start_date=timezone.now(),
            expiration_date=timezone.now() + timedelta(days=30),
            limit_group=self.limit_group,
        )

    @patch("stripe.Subscription.delete")
    @patch("keycloak_auth.backend.KeycloakAuthBackend.delete_user_in_keycloak")
    def test_delete_self_success(self, mock_keycloak_delete, mock_stripe_delete):
        """
        Test successful user deletion.
        """
        url = reverse("delete_self")
        self.client.force_authenticate(self.user)

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=self.user.id).exists())
        self.assertFalse(Subscription.objects.filter(
            id=self.subscription.id).exists())
        mock_keycloak_delete.assert_called_once_with(self.user.keycloak_id)
        mock_stripe_delete.assert_called_once_with(
            self.subscription.subscription_id)

    @patch("stripe.Subscription.delete")
    @patch("keycloak_auth.backend.KeycloakAuthBackend.delete_user_in_keycloak")
    def test_delete_self_keycloak_failure(self, mock_keycloak_delete, mock_stripe_delete):
        """
        Test user deletion when Keycloak deletion fails.
        """
        mock_keycloak_delete.side_effect = Exception(
            "Keycloak error")  # Simulate error in Keycloak
        url = reverse("delete_self")
        self.client.force_authenticate(self.user)

        response = self.client.delete(url)

        self.assertEqual(response.status_code,
                         status.HTTP_500_INTERNAL_SERVER_ERROR)
        # The user should remain
        self.assertTrue(User.objects.filter(id=self.user.id).exists())
        # The subscription should be deleted
        self.assertFalse(Subscription.objects.filter(
            id=self.subscription.id).exists())
        mock_keycloak_delete.assert_called_once_with(self.user.keycloak_id)
        mock_stripe_delete.assert_called_once_with(
            self.subscription.subscription_id)

    @patch("stripe.Subscription.delete")
    @patch("keycloak_auth.backend.KeycloakAuthBackend.delete_user_in_keycloak")
    def test_delete_self_stripe_failure(self, mock_keycloak_delete, mock_stripe_delete):
        """
        Test user deletion when Stripe subscription cancellation fails.
        """
        mock_keycloak_delete.return_value = True
        mock_stripe_delete.side_effect = Exception("Stripe error")
        url = reverse("delete_self")
        self.client.force_authenticate(self.user)

        response = self.client.delete(url)

        self.assertEqual(response.status_code,
                         status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertTrue(User.objects.filter(id=self.user.id).exists())
        self.assertTrue(Subscription.objects.filter(
            id=self.subscription.id).exists())
        mock_stripe_delete.assert_called_once_with(
            self.subscription.subscription_id)

    @patch("keycloak_auth.backend.KeycloakAuthBackend.delete_user_in_keycloak")
    def test_delete_self_no_subscription(self, mock_keycloak_delete):
        """
        Test user deletion when no subscription exists.
        """
        mock_keycloak_delete.return_value = True
        self.subscription.delete()
        url = reverse("delete_self")
        self.client.force_authenticate(self.user)

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=self.user.id).exists())
