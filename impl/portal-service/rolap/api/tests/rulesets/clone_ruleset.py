from datetime import timedelta

from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rolap.api.models import LimitGroup
from rolap.api.models import Subscription
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase


class CloneRulesetTestCase(RulesetAbstractTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_clone_ruleset(self):
        url = reverse("duplicate-ruleset",
                      kwargs={"ruleset_id": self.ruleset.pk})
        data = {"name": "duplicated ruleset",
                "description": "duplicated ruleset"}
        response = self.client.post(url, data=data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], data["name"])
        self.assertEqual(response.data["description"], data["description"])

    def test_clone_ruleset_duplicate_name(self):
        url = reverse("duplicate-ruleset",
                      kwargs={"ruleset_id": self.ruleset.pk})
        data = {"name": self.ruleset.name,
                "description": "duplicated ruleset"}
        response = self.client.post(url, data=data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["err_msg_id"], "ruleset_exists")

    def test_clone_ruleset_limit_exceeded(self):
        limit_group = LimitGroup.objects.create(
            name="storage_basic",
            max_rows=5,
            max_columns=5,
            max_size=100 * 1024,
            max_sum_size=1000 * 1024,
            max_projects=10,
            max_datasets=10,
            max_rulesets=0,
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
        url = reverse("duplicate-ruleset",
                      kwargs={"ruleset_id": self.ruleset.pk})
        data = {"name": "duplicated ruleset",
                "description": "duplicated ruleset"}
        response = self.client.post(url, data=data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["err_msg_id"], "rulesets_limit_reached")
