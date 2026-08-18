from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models import Tour


class ToursViewsTestCase(TestCase):

    LIST_ENDPOINT_NAME = 'tours-list'
    DETAILS_ENDPOINT_NAME = 'tours-detail'

    def setUp(self):
        self.client: APIClient = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_OPERATOR_ROLE]

    def test_add_new_tour(self):
        self.client.force_authenticate(user=self.user)
        tour_name: str = 'Sample tour'
        url = reverse(self.LIST_ENDPOINT_NAME)

        response = self.client.post(
            url, {'name': tour_name}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Tour.objects.count(), 1)
        self.assertEqual(Tour.objects.get().name, tour_name)

    def test_get_all_tours(self):
        self.client.force_authenticate(user=self.user)
        tour_name = 'Sample tour'
        Tour.objects.create(name=tour_name)
        url = reverse(self.LIST_ENDPOINT_NAME)

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["name"], tour_name)
        self.assertEqual(len(response.data), 1)

    def test_get_single_tour(self):
        self.client.force_authenticate(user=self.user)
        tour = Tour.objects.create(name='Sample tour')
        url = reverse(self.DETAILS_ENDPOINT_NAME, args=[tour.pk])

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], tour.pk)

    def test_update_tour(self):
        self.client.force_authenticate(user=self.user)
        tour = Tour.objects.create(name='Sample tour')
        url = reverse(self.DETAILS_ENDPOINT_NAME, args=[tour.pk])

        new_tour_name: str = 'New tour name tour'
        response = self.client.patch(
            url, {'name': new_tour_name}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Tour.objects.get().name, new_tour_name)

    def test_unauthorized(self):
        self.client.force_authenticate(user=self.user)
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.user.save()
        url = reverse(self.LIST_ENDPOINT_NAME)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_tour(self):
        self.client.force_authenticate(user=self.user)
        tour = Tour.objects.create(name='Sample tour')
        url = reverse(self.DETAILS_ENDPOINT_NAME, args=[tour.pk])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Tour.objects.count(), 0)
