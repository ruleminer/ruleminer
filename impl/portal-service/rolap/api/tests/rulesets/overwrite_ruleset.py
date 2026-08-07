from copy import deepcopy
from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rolap.api.models.rulesets.rulesets_db import Rules
from rolap.api.models.tasks import Task
from rolap.api.serializers.rulesets.creation import OverwriteRulesetSerializer
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase


class OverwriteRulesetTestCase(RulesetAbstractTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_overwrite_ruleset(self):
        # duplicate the last rule in the ruleset
        ruleset_json = deepcopy(self.ruleset.ruleset)
        ruleset_json['rules'].append(ruleset_json['rules'][-1])

        with patch("rolap.celery.app.send_task", return_value=1) as mock_send_task:
            url = reverse("overwrite-ruleset",
                          kwargs={"ruleset_id": self.ruleset.pk})
            self.client.force_authenticate(self.user)

            serializer = OverwriteRulesetSerializer(data={
                'ruleset': ruleset_json,
                'rules_labels': {
                    rule['uuid']: []
                    for rule in ruleset_json['rules']
                }
            })
            serializer.is_valid(raise_exception=True)
            payload = serializer.data

            response = self.client.patch(
                url, data=payload, format='json'
            )

            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            created_task_id = response.json()['task_id']
            self.assertTrue(
                Task.objects.filter(pk=created_task_id).exists(),
                'Should have created a task'
            )
            task: Task = Task.objects.get(pk=created_task_id)
            self.assertEqual(task.source_object_id, self.ruleset.pk)
            mock_send_task.assert_called_once()
