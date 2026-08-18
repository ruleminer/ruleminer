from django.conf import settings
from django.urls import reverse
from django.utils.http import urlencode
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models import Project


class DeleteMultipleProjectsViewTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            keycloak_id=1, username="test", email="test@test.com", password="test",
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project1 = Project.objects.create(name="test1", owner=self.user)
        self.project2 = Project.objects.create(name="test2", owner=self.user)
        self.project3 = Project.objects.create(name="test3", owner=self.user)

    def test_delete_multiple_projects(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("project-delete-multiple-projects")
        query = {"projects": f"{self.project1.pk},{self.project2.pk}"}
        url = f"{url}?{urlencode(query)}"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.user.projects.count(), 1)
        self.assertEqual(self.user.projects.first(), self.project3)

    def test_delete_multiple_projects_wrong(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("project-delete-multiple-projects",)
        query = {
            "projects": f"{self.project1.pk},{self.project2.pk},{self.project3.pk + 1}"}
        url = f"{url}?{urlencode(query)}"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
