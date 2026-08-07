from copy import deepcopy
from uuid import uuid4

from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rolap.api.models.rulesets.rulesets_db import Rules
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.models.tasks import Task
from rolap.api.models.tasks import TaskType
from rolap.api.serializers.rulesets.creation import CommitStatisticsSerializer
from rolap.api.serializers.rulesets.creation import RulesetStatisticsSerializer
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase


class CommitRulesetIndicatorsViewTestCase(RulesetAbstractTestCase):

    def setUp(self) -> None:
        super().setUp()
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.task = Task.objects.create(
            project=self.project,
            status=Task.TaskStatus.SUCCESS,
            meta={},
            type=TaskType.SAVE_RULESET,
            source_object=self.ruleset
        )

    def test_commit_permissions(self):
        url = reverse("ruleset-indicators-result",)
        self.client.force_authenticate(self.user)
        response = self.client.post(url, data={}, format='json')
        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN,
            'Only celery_worker users should be able to commit indicators.'
        )

    def test_overwriting_ruleset_indicators(self):
        # add required permissions to access this endpoint
        self.user._permissions.append(settings.KEYCLOAK_WORKER_ROLE)

        # duplicate the last rule in the ruleset
        ruleset_json = deepcopy(self.ruleset.ruleset)
        rule_to_add = deepcopy(ruleset_json['rules'][-1])
        rule_to_add['uuid'] = str(uuid4())
        ruleset_json['rules'].append(rule_to_add)

        ruleset_kwargs = {'some': 'kwargs'}
        generation_params = {'some': 'params'}
        statistics_serializer = RulesetStatisticsSerializer(data={
            'rule_coverage': {
                rule['uuid']: {'p': 5, 'n': 2, 'P': 10, 'N': 20}
                for rule in ruleset_json['rules']
            },
            'characteristics': {
                'rules_count': len(ruleset_json['rules']),
            },
            'rule_indicators': {
                rule['uuid']: {'C2': '1.0'}
                for rule in ruleset_json['rules']
            },
            'condition_importance': {'condition': 'importance'},
            'attribute_importance': {'attribute': 'importance'},
            'prediction_indicators': {'prediction': 'indicators'},
            'rule_histograms': None,
            'calculation_time': 2000.
        })
        statistics_serializer.is_valid(raise_exception=True)
        rules_labels = {
            rule['uuid']: []
            for rule in ruleset_json['rules']
        }
        extra_info = {'something': 'extra!'}
        serializer = CommitStatisticsSerializer(data={
            'ruleset_kwargs': ruleset_kwargs,
            'ruleset': self.ruleset.ruleset,
            'generation_params': generation_params,
            'statistics': statistics_serializer.data,
            'rules_labels': rules_labels,
            'celery_task': self.task.pk,
            'extra_info': extra_info,
            'overwrite_ruleset_id': self.ruleset.pk,
            'prediction_config': {
                'prediction_strategy': 'vote',
                'use_default_rule': True
            }
        })
        serializer.is_valid(raise_exception=True)
        payload = serializer.data

        url = reverse("ruleset-indicators-result",)
        self.client.force_authenticate(self.user)
        response = self.client.post(
            url, data=payload, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        updated_ruleset: Ruleset = Ruleset.objects.get(pk=self.ruleset.pk)
        self.assertEqual(
            updated_ruleset.rules_count, len(ruleset_json['rules']),
            'Should have updated the rules_count'
        )
        all_ruleset_rules: int = Rules.objects.filter(
            ruleset=updated_ruleset).count()
        self.assertEqual(
            all_ruleset_rules, len(ruleset_json['rules']),
            'There should be as many rules in db as in the ruleset json'
        )
