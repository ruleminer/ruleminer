from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.exceptions import UnsupportedProblemTypeException
from rolap.api.models import IndicatorMeta
from rolap.api.models import Project


class IndicatorsMetaViewTests(APITestCase):

    ENDPOINT_NAME = 'indicators_meta-list'

    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1',
            username='testuser',
            email='testuser@test.com',
            password='testuser'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]

        self.clf_indicator_meta = IndicatorMeta.objects.create(
            key='clf_indicator',
            description_en="description_en",
            description_pl="description_pl",
            type_of_problem=Project.CLASSIFICATION,
            higher_is_better=True
        )
        self.reg_indicator_meta = IndicatorMeta.objects.create(
            key='reg_indicator',
            description_en="description_en",
            description_pl="description_pl",
            type_of_problem=Project.CLASSIFICATION,
            higher_is_better=True
        )
        self.surv_indicator_meta = IndicatorMeta.objects.create(
            key='surv_indicator',
            description_en="description_en",
            description_pl="description_pl",
            type_of_problem=Project.CLASSIFICATION,
            higher_is_better=True
        )
        self.common_indicator_meta = IndicatorMeta.objects.create(
            key='common_indicator',
            description_en="description_en",
            description_pl="description_pl",
            type_of_problem=IndicatorMeta.COMMON_FOR_ALL_PROBLEMS,
            higher_is_better=True
        )

    def test_listing_all_indicators_meta(self):
        self.client.force_authenticate(self.user)
        url = reverse(self.ENDPOINT_NAME)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            len(response.data),
            IndicatorMeta.objects.count(),
            'Should list all indicators meta'
        )

    def test_listing_indicators_for_given_type_of_problem(self):
        self.client.force_authenticate(self.user)
        url = reverse(self.ENDPOINT_NAME)
        type_of_problem: str = Project.CLASSIFICATION
        response = self.client.get(
            url,  {'type_of_problem': type_of_problem}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_problem_types: list[str] = [
            type_of_problem, IndicatorMeta.COMMON_FOR_ALL_PROBLEMS
        ]
        self.assertTrue(
            all([
                e['type_of_problem'] in expected_problem_types for e in response.data
            ]),
            'Should list only indicators for given type of problem'
        )

    def test_listing_indicators_for_nonexistent_type_of_problem(self):
        self.client.force_authenticate(self.user)
        url = reverse(self.ENDPOINT_NAME)
        response = self.client.get(
            url, {'type_of_problem': 'nonexistent'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['err_msg_id'],
            UnsupportedProblemTypeException('').err_msg_id,
            'Should raise UnsupportedProblemTypeException exception'
        )
