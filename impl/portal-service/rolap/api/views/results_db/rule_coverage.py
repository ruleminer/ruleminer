from typing import Optional

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Project
from rolap.api.models import Rules
from rolap.api.models import Ruleset
from rolap.api.serializers.rulesets.rulesets import CoverageSerializer
from rolap.api.views.base import RulesetBaseView


class RuleCoverageView(RulesetBaseView):
    """Retrieves and returns the rule coverage information for a given dataset and ruleset.

            Args:
                request (Request): The HTTP request object.
                dataset_id (int): The ID of the dataset.
                ruleset_id (int): The ID of the ruleset.

            Returns:
                Response: An HTTP response containing the rule coverage information - rule_uuid, p, n, P, N.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_db']

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return CoverageSerializer()

    schema = _CustomSchema(operation_id_base="rule_coverage")
    serializer_class = CoverageSerializer

    def _cast_float_or_return_none(self, x: Optional[float]) -> Optional[float]:
        if x is None:
            return None
        x = float(x)
        if x == float('inf'):
            return 'inf'
        if x == float('-inf'):
            return '-inf'
        return x

    def _cast_int_or_return_none(self, x: Optional[float]) -> Optional[float]:
        return int(x) if x is not None else None

    def get_rule_coverage(self):
        ruleset: Ruleset = self.get_object()
        rules_query = Rules.objects \
            .filter(ruleset=ruleset).values(
                "uuid",
                "p",
                "n",
                "P",
                "N",
                "train_covered_y_std",
                "train_covered_y_mean",
                "kaplan_meier_estimator",
                "indicators"
            )
        rule_coverage = {}
        for item in rules_query:
            rule = {
                'p': item['p'],
                'n': item['n'],
                'P': item['P'],
                'N': item['N'],
                'train_covered_y_std': item.get('train_covered_y_std'),
                'train_covered_y_mean': item.get('train_covered_y_mean'),

            }
            if ruleset.project.type_of_problem == Project.SURVIVAL:
                rule['kaplan_meier_estimator'] = item.get(
                    'kaplan_meier_estimator'
                )
                rule['median_survival_time'] = self._cast_float_or_return_none(
                    item.get('indicators', {}).get('median_survival_time')
                )
                rule['median_survival_time_ci_upper'] = self._cast_float_or_return_none(
                    item.get('indicators', {}).get(
                        'median_survival_time_ci_upper')
                )
                rule['median_survival_time_ci_lower'] = self._cast_float_or_return_none(
                    item.get('indicators', {}).get(
                        'median_survival_time_ci_lower')
                )
                rule['log_rank'] = self._cast_float_or_return_none(
                    item.get('indicators', {}).get('log_rank')
                )
                rule['events_count'] = self._cast_int_or_return_none(
                    item.get('indicators', {}).get('events_count')
                )
                rule['censored_count'] = self._cast_int_or_return_none(
                    item.get('indicators', {}).get('censored_count')
                )
            rule = {k: v for k, v in rule.items() if v is not None}
            rule_coverage[item['uuid']] = rule
        return rule_coverage

    def get(self, *args, **kwargs):
        rule_coverage = self.get_rule_coverage()
        serializer = self.serializer_class({"rule_coverage": rule_coverage})
        return Response(serializer.data, status=status.HTTP_200_OK)
