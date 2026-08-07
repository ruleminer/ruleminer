from django.http import Http404
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import RulesetNotFoundException
from rolap.api.models import ImportanceResults
from rolap.api.models.projects import Project
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.permissions import IsRolapUser
from rolap.api.permissions import OwnerPermission
from rolap.api.serializers.results import ImportanceSerializer
from rolap.api.serializers.rulesets.rulesets import RequestRulesetSerializer
from rolap.api.utils.indicators import sort_importance
from rolap.api.views.base import DatasetBaseView


class ImportanceView(DatasetBaseView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['results_db']

        def get_request_serializer(self, path, method):
            return RequestRulesetSerializer()

        def get_response_serializer(self, path, method):
            return ImportanceSerializer()

    schema = _CustomSchema(operation_id_base="importance")

    serializer_class = ImportanceSerializer
    permission_classes = [IsRolapUser & OwnerPermission]

    def get_importance_result(self):
        try:
            ruleset: Ruleset = get_object_or_404(
                Ruleset, pk=self.kwargs.get('ruleset_id'))
        except Http404:
            raise RulesetNotFoundException()
        self.check_object_permissions(self.request, ruleset)
        return ImportanceResults.objects.filter(ruleset=ruleset)

    def get(self, request, *args, **kwargs):
        dataset = self.get_object()
        project: Project = dataset.project
        type_of_problem: str = project.type_of_problem
        queryset = self.filter_queryset(self.get_importance_result())
        importance_result = queryset.first()
        if importance_result:
            if type_of_problem == "classification":
                sorted_condition_importance = sort_importance(
                    importance_result.condition_importance)
                sorted_attribute_importance = sort_importance(
                    importance_result.attribute_importance)
            else:
                sorted_condition_importance = importance_result.condition_importance
                sorted_attribute_importance = importance_result.attribute_importance
            serializer = self.get_serializer({
                'condition_importance': sorted_condition_importance,
                'attribute_importance': sorted_attribute_importance
            })

            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)
