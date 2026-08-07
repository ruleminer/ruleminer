from django.http import Http404
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import RulesetNotFoundException
from rolap.api.models.datasets import Dataset
from rolap.api.models.indicators import CalculateImportanceRequest
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.permissions import IsRolapUser
from rolap.api.permissions import OwnerPermission
from rolap.api.serializers.results import ImportanceSerializer
from rolap.api.serializers.rulesets.rulesets import RequestRulesetSerializer
from rolap.api.utils.http import IndicatorHttpService
from rolap.api.utils.indicators import sort_importance
from rolap.api.utils.ruleset_db_helper import get_ruleset_induction_measure
from rolap.api.views.base import DatasetBaseView


class DeterminationImportanceView(DatasetBaseView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['results_calc']

        def get_request_serializer(self, path, method):
            return RequestRulesetSerializer()

        def get_response_serializer(self, path, method):
            return ImportanceSerializer()

    schema = _CustomSchema(operation_id_base="determination_importance")

    serializer_class = ImportanceSerializer
    permission_classes = [IsRolapUser & OwnerPermission]

    def put(self, request: Request, *args, **kwargs) -> Response:
        """Recalculate the importance of conditions for the sent set of rules and given dataset.

        Args:
            request (Request): The HTTP request object.
            dataset_id (int): The ID of the dataset.

        Returns:
            Response:An HTTP response containing the recalculated conditions importance.
        """
        indicator_service = IndicatorHttpService()
        request_serializer = RequestRulesetSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        dataset: Dataset = self.get_object()

        dataset_path = str(dataset.path)
        project = dataset.project
        type_of_problem = project.type_of_problem
        try:
            original_ruleset: Ruleset = get_object_or_404(
                Ruleset, pk=request_serializer.data["original_ruleset_id"])
        except Http404:
            raise RulesetNotFoundException()
        induction_measure: str = get_ruleset_induction_measure(
            original_ruleset.generation_params
        )

        # get prediction config and update it from request
        prediction_config = original_ruleset.get_updated_config(
            request_serializer.data.get('prediction_config', {})
        )

        payload = CalculateImportanceRequest(
            dataset_path=dataset_path,
            type=type_of_problem,
            measure=induction_measure,
            voting_measure=prediction_config.voting_measure,
            ruleset=request.data['ruleset'],
            rule_coverage=request.data['rule_coverage']
        )
        data = indicator_service.calculate_importance(payload)
        if type_of_problem == "classification":
            sorted_condition_importance = sort_importance(
                data['condition_importance'])
            sorted_attribute_importance = sort_importance(
                data['attribute_importance'])
        else:
            sorted_condition_importance = data['condition_importance']
            sorted_attribute_importance = data['attribute_importance']

        serializer = ImportanceSerializer(data={
            'condition_importance': sorted_condition_importance,
            'attribute_importance': sorted_attribute_importance
        })
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
