from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from django.utils.http import urlencode
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.models import Task
from rolap.api.models import TaskType


class TaskDetailViewTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project: Project = Project.objects.create(
            name='Test Project', description='This is a test project.', type_of_problem='classification',
            owner=self.user
        )
        self.dataset: Dataset = Dataset.objects.create(
            name='Test Dataset', description='This is a test dataset.', project=self.project,
        )
        task_data1 = {
            "status": Task.TaskStatus.PENDING,
            "type": TaskType.LEARNING,
            "project": self.project,
            "meta": {},
        }
        self.task1 = Task.objects.create(**task_data1)
        task_data2 = {
            "status": Task.TaskStatus.SUCCESS,
            "create_timestamp": timezone.now() - timezone.timedelta(minutes=15),
            "start_timestamp": timezone.now() - timezone.timedelta(minutes=10),
            "finish_timestamp": timezone.now(),
            "type": TaskType.LEARNING,
            "project": self.project,
            "meta": {},
        }
        self.task2 = Task.objects.create(**task_data2)
        task_data3 = {
            "status": Task.TaskStatus.FAILURE,
            "create_timestamp": timezone.now() - timezone.timedelta(minutes=15),
            "start_timestamp": timezone.now() - timezone.timedelta(minutes=10),
            "finish_timestamp": timezone.now(),
            "type": TaskType.LEARNING,
            "project": self.project,
            "meta": {},
        }
        self.task3 = Task.objects.create(**task_data3)
        self.task1.source_object = self.dataset
        self.task1.save()
        self.task2.source_object = self.dataset
        self.task2.save()
        self.task3.source_object = self.dataset
        self.task3.save()

    def test_get_task_detail(self):
        url = reverse("task-detail", args=[self.task1.pk])
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["source_object_id"],
                         self.task1.source_object.pk)

    def test_get_task_detail_not_found(self):
        url = reverse("task-detail", args=[self.task3.pk + 5])
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_all_tasks(self):
        url = reverse("task-list", kwargs={"project_id": self.project.pk})
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 3)

    def test_get_pending_tasks(self):
        url = reverse("task-list", kwargs={"project_id": self.project.pk})
        query_params = urlencode({"status": "pending"})
        url = f"{url}?{query_params}"
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_get_pending_and_failed_tasks(self):
        url = reverse("task-list", kwargs={"project_id": self.project.pk})
        query_params = urlencode(
            {"status__in": f"{Task.TaskStatus.PENDING},{Task.TaskStatus.FAILURE}"})
        url = f"{url}?{query_params}"
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_get_tasks_nonexistent_project(self):
        url = reverse("task-list", kwargs={"project_id": self.project.pk + 1})
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_tasks_forbidden(self):
        url = reverse("task-list", kwargs={"project_id": self.project.pk})
        self.user._permissions = []
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_tasks_wrong_user(self):
        url = reverse("task-list", kwargs={"project_id": self.project.pk})
        another_user: User = User.objects.create_user(
            keycloak_id='2', username='another_user', email='testuser2@test.com', password='testpass'
        )
        another_user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.client.force_authenticate(another_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
