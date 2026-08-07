from datetime import datetime
from datetime import timedelta
from typing import Any
from typing import Dict
from typing import List
from typing import Union

import pytz
from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient
from rolap.api.models import LimitGroup
from rolap.api.models import Subscription
from rolap.api.models.projects import Project


class ProjectsViewTestCase(TestCase):

    def setUp(self) -> None:
        self.client = APIClient()

        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.user_without_projects: User = User.objects.create_user(
            keycloak_id='2', username='testuser2', email='testuser2@test.com', password='testpass2'
        )
        self.user_without_projects._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project_data: dict = {
            'name': 'Test post Project',
            'description': 'This is a post test project.',
            'type_of_problem': 'classification'
        }

        self.project: Project = Project.objects.create(
            name='Test Project', description='This is a test project.', type_of_problem='classification', owner=self.user
        )

    def test_get_returns_project_list(self):
        self.client.force_authenticate(self.user)
        response: Response = self.client.get(reverse('projects'))
        response_data: List[Dict[str, Any]] = response.data

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_data), 1)
        self.assertEqual(response_data[0]['name'], self.project.name)
        self.assertEqual(
            response_data[0]['description'], self.project.description)
        self.assertEqual(
            response_data[0]['type_of_problem'], self.project.type_of_problem)
        self.assertEqual(
            datetime.fromisoformat(response_data[0]['created_at']).replace(
                tzinfo=None).astimezone(pytz.timezone('Europe/Warsaw')),
            self.project.created_at.astimezone(pytz.timezone('Europe/Warsaw'))
        )
        self.assertEqual(
            datetime.fromisoformat(response_data[0]['updated_at']).replace(
                tzinfo=None).astimezone(pytz.timezone('Europe/Warsaw')),
            self.project.updated_at.astimezone(pytz.timezone('Europe/Warsaw'))
        )

    def test_get_returns_error_when_user_has_no_projects(self):
        self.client.force_authenticate(self.user_without_projects)
        response: Response = self.client.get(reverse('projects'))
        response_data: Dict[str, str] = response.data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data, [])

    def test_post_creates_project(self):
        self.client.force_authenticate(self.user)
        response: Response = self.client.post(
            reverse('projects'), data=self.project_data)
        response_data: Dict[str, Union[str, datetime.datetime]] = response.data

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_data['name'], self.project_data['name'])
        self.assertEqual(
            response_data['description'], self.project_data['description'])
        self.assertEqual(
            response_data['type_of_problem'], self.project_data['type_of_problem'])
        self.assertIsNotNone(response_data['created_at'])
        self.assertIsNotNone(response_data['updated_at'])

    def test_create_project_limit_exceeded(self):
        limit_group = LimitGroup.objects.create(
            name="storage_basic",
            max_rows=5,
            max_columns=5,
            max_size=100 * 1024,
            max_sum_size=1000 * 1024,
            max_projects=0,
            max_datasets=10,
            max_rulesets=10,
            max_reports=10,
        )
        start_date = timezone.now().date()
        expiration_date = start_date + timedelta(days=30)
        Subscription.objects.create(
            user=self.user,
            limit_group=limit_group,
            subscription_id="sub_id",
            start_date=start_date,
            expiration_date=expiration_date,
            email="example@gmail.com",
        )
        self.client.force_authenticate(self.user)
        response: Response = self.client.post(
            reverse('projects'), data=self.project_data)
        response_data: Dict[str, str] = response.data
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response_data["err_msg_id"], "projects_limit_reached")
