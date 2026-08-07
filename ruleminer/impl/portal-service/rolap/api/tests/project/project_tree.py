from datetime import timedelta

from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rolap.api.models import Algorithm
from rolap.api.models import Dataset
from rolap.api.models import LimitGroup
from rolap.api.models import Project
from rolap.api.models import Report
from rolap.api.models import Ruleset
from rolap.api.models import Subscription
from rolap.api.serializers.projects import ProjectTreeSerializer


class ProjectTreeViewTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project = Project.objects.create(
            name='Test Project',
            description='Test description',
            type_of_problem=Project.CLASSIFICATION,
            owner=self.user
        )
        self.dataset1 = Dataset.objects.create(
            project=self.project,
            name='Dataset1'
        )
        self.dataset2 = Dataset.objects.create(
            project=self.project,
            name='Dataset2'
        )
        self.algorithm1 = Algorithm.objects.create(
            name='Algorithm1',
            version='1.0',
            problem_type=Algorithm.CLASSIFICATION,
            description_pl='Opis po polsku',
            description_en='Description in English'
        )
        self.ruleset1 = Ruleset.objects.create(
            name='Ruleset1',
            attached_to_dataset=self.dataset1,
            algorithm=self.algorithm1
        )
        self.ruleset2 = Ruleset.objects.create(
            name='Ruleset2',
            attached_to_dataset=self.dataset1,
            algorithm=self.algorithm1
        )
        self.ruleset3 = Ruleset.objects.create(
            name='Ruleset3',
            attached_to_dataset=self.dataset2,
            algorithm=self.algorithm1
        )
        self.ruleset4 = Ruleset.objects.create(
            name='Ruleset4',
            attached_to_dataset=self.dataset2,
            algorithm=self.algorithm1
        )
        self.report1 = self.dataset1.reports.create(
            title="EDA report",
            storage_path="test_path1",
            type=Report.ReportType.EDA,
            generation_params={},
        )
        self.report2 = self.dataset2.reports.create(
            title="EDA report",
            storage_path="test_path2",
            type=Report.ReportType.EDA,
            generation_params={},
        )

    def test_project_tree_view(self):
        url = reverse("project-tree", kwargs={"id": self.project.id})
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        serializer_project_tree = ProjectTreeSerializer(self.project)
        # this is a patch just for tests - no point repeating the annotating code from the view
        for item in serializer_project_tree.data['items']:
            item["is_active"] = True
            for lower_item in item["items"]:
                lower_item["limit_reached"] = False
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer_project_tree.data)

    def test_project_tree_view_with_limits_lowered(self):
        limit_group = LimitGroup.objects.create(
            name="storage_basic",
            max_rows=5,
            max_columns=5,
            max_size=100 * 1024,
            max_sum_size=1000 * 1024,
            max_projects=10,
            max_datasets=10,
            max_rulesets=1,
            max_reports=1,
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
        url = reverse("project-tree", kwargs={"id": self.project.id})
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        serializer_project_tree = ProjectTreeSerializer(self.project)
        # this is a patch just for tests - no point repeating the annotating code from the view
        for item in serializer_project_tree.data['items']:
            item["is_active"] = True
            for lower_item in item["items"]:
                lower_item["limit_reached"] = True
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer_project_tree.data)

    def test_project_tree_view_nonexistent_project(self):
        url = reverse("project-tree", kwargs={"id": 999})
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
