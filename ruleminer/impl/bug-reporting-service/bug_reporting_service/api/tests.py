import io
import random

from bug_reporting_service.api.models import BugReport
from django.conf import settings
from django.http import FileResponse
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from PIL import Image
from PIL import ImageDraw
from rest_framework import status
from rest_framework.test import APIClient


def prepare_test_screenshot_file() -> io.BytesIO:
    # Create a blank image with a white bg
    width, height = 800, 600
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)

    # Generate and test random pixels
    for _ in range(100):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        color = (random.randint(0, 255), random.randint(
            0, 255), random.randint(0, 255))
        draw.point((x, y), fill=color)

    # Save the image
    file = io.BytesIO()
    image.save(file, format="PNG")
    file.seek(0)
    return file


class ReportBugViewTestCase(TestCase):

    ENDPOINT_NAME: str = 'report-bug'

    def setUp(self):
        self.client: APIClient = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1',
            username='testuser',
            email='testuser@test.com',
            password='testpass'
        )
        self.test_description = "Test description"
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.screenshot = prepare_test_screenshot_file()

    def test_report_bug_unauthorized(self):
        url = reverse(self.ENDPOINT_NAME)
        response = self.client.post(url, data={}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_report_bug_with_invalid_permissions(self):
        self.user._permissions = []
        self.client.force_authenticate(user=self.user)
        url = reverse(self.ENDPOINT_NAME)
        response = self.client.post(
            url, data={}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_report_bug_without_screenshot(self):
        url = reverse(self.ENDPOINT_NAME)
        self.client.force_authenticate(user=self.user)

        allow_contact = True
        response = self.client.post(
            url,
            data={
                "description": self.test_description,
                "allow_contact": True,
            },
            format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BugReport.objects.count(), 1,
                         'Should create a single bug report')
        bug_report = BugReport.objects.first()
        self.assertEqual(
            bug_report.author.pk, self.user.pk,
            'Users should match'
        )
        self.assertEqual(
            bug_report.description, self.test_description,
            'Description should match'
        )
        self.assertEqual(
            bug_report.allow_contact, allow_contact,
            'Allow contact flag should match'
        )

    def test_report_bug_with_screenshot(self):
        self.client.force_authenticate(user=self.user)
        url = reverse(self.ENDPOINT_NAME)
        response = self.client.post(
            url,
            data={
                "description": "test_description",
                "allow_contact": True,
                "screenshot": self.screenshot
            },
            format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BugReport.objects.count(), 1,
                         'Should create a single bug report')
        bug_report = BugReport.objects.first()
        saved_screenshot = Image.open(bug_report.screenshot.path)
        saved_screenshot_file = io.BytesIO()
        saved_screenshot.save(saved_screenshot_file, format="PNG")
        self.assertEqual(
            saved_screenshot_file.getvalue(), self.screenshot.getvalue(),
            'Screenshots should match'
        )

    def test_listing_bugs_reports_unauthorized(self):
        url = reverse(self.ENDPOINT_NAME)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_listing_bugs_reports_with_invalid_permissions(self):
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.client.force_authenticate(user=self.user)
        url = reverse(self.ENDPOINT_NAME)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_listing_bugs_reports(self):
        self.user._permissions = [settings.KEYCLOAK_OPERATOR_ROLE]
        self.client.force_authenticate(user=self.user)
        url = reverse(self.ENDPOINT_NAME)
        response = self.client.get(url,)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json()['count'], BugReport.objects.count(),
            'Should fetch a single bug report'
        )


class BugReportScreenshotViewTestCase(TestCase):

    ENDPOINT_NAME: str = 'preview-bug-report-screenshot'

    def setUp(self):
        self.client: APIClient = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1',
            username='testuser',
            email='testuser@test.com',
            password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_OPERATOR_ROLE]
        self.bug_report: BugReport = BugReport.objects.create(
            author=self.user,
            description="test_description",
            allow_contact=True,
        )
        self.screenshot = prepare_test_screenshot_file()
        self.bug_report.screenshot.save(
            "test.png", self.screenshot
        )
        self.bug_report.save()

    def test_unauthorized(self):
        url = reverse(self.ENDPOINT_NAME, kwargs={"pk": self.bug_report.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_with_invalid_permissions(self):
        self.user._permissions = []
        self.client.force_authenticate(user=self.user)
        url = reverse(self.ENDPOINT_NAME, kwargs={"pk": self.bug_report.pk})
        response = self.client.post(
            url, data={}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_for_nonexistent_report(self):
        self.client.force_authenticate(user=self.user)
        url = reverse(self.ENDPOINT_NAME, kwargs={"pk": 9999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_for_report_without_screenshot(self):
        self.bug_report.screenshot.delete()
        self.bug_report.save()
        self.client.force_authenticate(user=self.user)
        url = reverse(self.ENDPOINT_NAME, kwargs={"pk": self.bug_report.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_getting_report_screenshot(self):
        url = reverse(self.ENDPOINT_NAME, kwargs={"pk": self.bug_report.pk})
        self.client.force_authenticate(user=self.user)
        response: FileResponse = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get('Content-Type'), 'image/png')

        screenshot = io.BytesIO(bytes(response.getvalue()))
        self.assertEqual(
            screenshot.getvalue(), self.screenshot.getvalue(),
            'Screenshots should match'
        )
