from datetime import timedelta

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rolap.api.models import LimitGroup
from rolap.api.models import Subscription
from rolap.api.models.datasets import Dataset
from rolap.api.models.reports import Report
from rolap.api.tests.datasets.rulesets import BaseSetup


class GenerateEDAReportViewTestCase(BaseSetup):
    def setUp(self):
        super().setUp()
        self.report_title = "Existing EDA Report"
        dataset_content_type = ContentType.objects.get_for_model(Dataset)
        self.report = Report.objects.create(
            title=self.report_title, content_type=dataset_content_type, object_id=self.dataset.id,
            type=Report.ReportType.EDA)
        self.url = reverse('generate_eda_report', kwargs={
                           'dataset_id': self.dataset.pk})

    def test_eda_report_creation_with_unique_title_success(self):
        data = {"title": "New Unique EDA Report Title"}
        url = reverse("generate_eda_report", kwargs={
                      "dataset_id": self.dataset.id})
        self.client.force_authenticate(self.user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_eda_report_creation_with_duplicate_title_fails(self):
        data = {"title": self.report_title}
        url = reverse("generate_eda_report", kwargs={
                      "dataset_id": self.dataset.id})
        self.client.force_authenticate(self.user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_eda_report_creation_report_limit_reached(self):
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE, "storage_basic"]
        limit_group = LimitGroup.objects.create(
            name="storage_basic",
            max_rows=5,
            max_columns=5,
            max_size=100 * 1024,
            max_sum_size=1000 * 1024,
            max_projects=10,
            max_datasets=10,
            max_rulesets=10,
            max_reports=0,
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
        data = {"title": "New Unique EDA Report Title"}
        url = reverse("generate_eda_report", kwargs={
                      "dataset_id": self.dataset.id})
        self.client.force_authenticate(self.user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["err_msg_id"], "reports_limit_reached")


class GenerateEMAGReportViewTestCase(BaseSetup):
    def setUp(self):
        super().setUp()
        self.report_title = "Existing EMAG Report"
        dataset_content_type = ContentType.objects.get_for_model(Dataset)
        self.report = Report.objects.create(
            title=self.report_title, content_type=dataset_content_type, object_id=self.dataset.id,
            type=Report.ReportType.WHITEBOX)

    def test_discovery_report_success(self):
        data = {
            "title": "New Discovery Report Title",
            "preprocessing": {},
            "algorithms": {},
        }
        url = reverse("generate_discovery_report", kwargs={
                      "dataset_id": self.dataset.id})
        self.client.force_authenticate(self.user)
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_prediction_report_success(self):
        data = {
            "title": "New Prediction Report Title",
            "preprocessing": {},
            "algorithms": {},
            "settings": {},
        }
        url = reverse("generate_prediction_report", kwargs={
                      "dataset_id": self.dataset.id})
        self.client.force_authenticate(self.user)
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
