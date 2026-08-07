from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rolap.api.models import Dataset
from rolap.api.models import Project


class CreateExampleProjectViewTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            keycloak_id=1, username="test", email="test@test.com", password="test",
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]

    def test_create_projects_for_each_problem_type(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('project-create-example-projects')
        problem_types = [Project.CLASSIFICATION,
                         Project.REGRESSION, Project.SURVIVAL]
        for problem_type in problem_types:
            with self.subTest(problem_type=problem_type):
                response = self.client.post(
                    f"{url}?problem_type={problem_type}&language=en", {}, format='json')
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                self.assertTrue('project_id' in response.data)
                first_project_id = response.data['project_id']
                project = Project.objects.get(id=first_project_id)
                self.assertEqual(project.type_of_problem, problem_type,
                                 msg=f"Project type_of_problem mismatch for problem_type={problem_type}")
                self.assertTrue(Dataset.objects.filter(project=project).exists(
                ), msg=f"No dataset created for project with problem_type={problem_type}")

                response = self.client.post(
                    f"{url}?problem_type={problem_type}&language=en", {}, format='json')
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                self.assertTrue('project_id' in response.data)
                second_project_id = response.data['project_id']
                self.assertNotEqual(first_project_id, second_project_id)

                first_project = Project.objects.get(id=first_project_id)
                second_project = Project.objects.get(id=second_project_id)
                self.assertNotEqual(first_project.name, second_project.name)

                # also create a project with a different language
                response = self.client.post(
                    f"{url}?problem_type={problem_type}&language=pl", {}, format='json')
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                self.assertTrue('project_id' in response.data)
                third_project_id = response.data['project_id']
                self.assertNotEqual(first_project_id, third_project_id)
                self.assertNotEqual(second_project_id, third_project_id)

                third_project = Project.objects.get(id=third_project_id)
                self.assertNotEqual(first_project.name, third_project.name)
                self.assertNotEqual(first_project.description,
                                    third_project.description)
                first_dataset = first_project.datasets.first()
                third_dataset = third_project.datasets.first()
                self.assertNotEqual(first_dataset.description,
                                    third_dataset.description)

                Project.objects.all().delete()
                Dataset.objects.all().delete()

    def test_create_project_with_unsupported_problem_type(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('project-create-example-projects') + \
            '?problem_type=unsupported_type'
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_with_invalid_languate(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('project-create-example-projects') + \
            '?language=unsupported_language'
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
