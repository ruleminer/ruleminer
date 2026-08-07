from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.exceptions import TourNotCompletedYet
from rolap.api.models import CompletedTour
from rolap.api.models import Tour


class CompletedToursViewTests(APITestCase):

    LIST_ENDPOINT_NAME = 'completed_tours-list'
    DETAILS_ENDPOINT_NAME = 'completed_tours-detail'

    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1',
            username='testuser',
            email='testuser@test.com',
            password='testuser'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.other_user: User = User.objects.create_user(
            keycloak_id='2',
            username='other_user',
            email='other_user@test.com',
            password='other_user'
        )
        self.other_user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.tour1: Tour = Tour.objects.create(name='Test tour 1')
        self.tour2: Tour = Tour.objects.create(name='Test tour 2')

    def test_getting_completed_tours(self):
        url = reverse(self.LIST_ENDPOINT_NAME)
        self.client.force_authenticate(self.user)

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

        CompletedTour.objects.create(user=self.user, tour=self.tour1)
        CompletedTour.objects.create(user=self.other_user, tour=self.tour2)

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [{'name': self.tour1.name}])

    def test_completing_tours(self):
        url = reverse(self.LIST_ENDPOINT_NAME)
        self.client.force_authenticate(self.user)

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

        response = self.client.post(
            url, {'name': self.tour1.name}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [{'name': self.tour1.name}])

        # Try to complete the same tour again - shouldn't create a new row
        response = self.client.post(
            url, {'name': self.tour1.name}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CompletedTour.objects.count(), 1)

    def test_completing_nonexistent_tour(self):
        url = reverse(self.LIST_ENDPOINT_NAME)
        self.client.force_authenticate(self.user)

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

        response = self.client.post(
            url, {'name': 'Nonexistent tour'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_resetting_completed_tour(self):
        url = reverse(self.LIST_ENDPOINT_NAME)
        self.client.force_authenticate(self.user)
        CompletedTour.objects.create(user=self.user, tour=self.tour1)

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        url = reverse(self.DETAILS_ENDPOINT_NAME,
                      kwargs={'tour_name': self.tour1.name})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        url = reverse(self.LIST_ENDPOINT_NAME)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_resetting_non_completed_tour(self):
        self.client.force_authenticate(self.user)
        CompletedTour.objects.create(user=self.user, tour=self.tour1)
        url = reverse(self.DETAILS_ENDPOINT_NAME,
                      kwargs={'tour_name': self.tour2.name})
        response = self.client.delete(url)
        err_msg_id: str = TourNotCompletedYet('').err_msg_id
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['err_msg_id'], err_msg_id)
