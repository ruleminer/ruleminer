from django.db import IntegrityError
from django.db import transaction
from django.http import Http404
from django.shortcuts import get_list_or_404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListCreateAPIView
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import LabelExistsException
from rolap.api.exceptions import LabelNotFoundException
from rolap.api.exceptions import RuleNotFoundException
from rolap.api.models.labels import Label
from rolap.api.models.rulesets.rulesets_db import Rules
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.permissions import IsRolapUser
from rolap.api.permissions import OwnerPermission
from rolap.api.serializers.labels import LabelSerializer
from rolap.api.views.base import RulesetBaseView


class LabelListCreateView(ListCreateAPIView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['labels']

    schema = _CustomSchema(operation_id_base="labels_list")
    permission_classes = [IsRolapUser & OwnerPermission]
    serializer_class = LabelSerializer
    pagination_class = None

    def get_queryset(self):
        return Label.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        try:
            serializer.save(owner=self.request.user)
        except IntegrityError:
            raise LabelExistsException()


class LabelRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['labels']

    schema = _CustomSchema(operation_id_base="labels_detail")
    permission_classes = [IsRolapUser & OwnerPermission]
    serializer_class = LabelSerializer
    queryset = Label.objects.all()
    lookup_url_kwarg = 'label_id'

    def get_object(self):
        try:
            return super().get_object()
        except Http404:
            raise LabelNotFoundException()

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except IntegrityError:
            raise LabelExistsException()


class RulesLabelsView(RulesetBaseView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['labels']

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="rules_labels")

    def get(self, *args, **kwargs) -> Response:
        """Get labels for each rule in ruleset

        Args:
            request (Request): Request object.
            ruleset_id (int): The identifier of the ruleset for which labels of rules are to be retrieved.

        Returns:
            Response: An HTTP response object containing the serialized labels data for each rule in the specified ruleset.
        """
        ruleset: Ruleset = self.get_object()
        rules = ruleset.rules.all()
        rules_labels: dict = {}
        for rule in rules:
            labels = rule.assigned_labels.all()
            serializer: LabelSerializer = LabelSerializer(labels, many=True)
            rules_labels[str(rule.uuid)] = serializer.data

        return Response(rules_labels, status=status.HTTP_200_OK)

    def post(self, request: Request, *args, **kwargs) -> Response:
        """Update labels assigned to rules within a ruleset.

        Args:
            request (Request): The request object containing a JSON body. The JSON body should be a dictionary where keys are the UUIDs of rules
                               and values are lists of label IDs that are to be assigned to these rules.
            ruleset_id (int): The identifier of the ruleset for which labels of rules are to be updated.

        Returns:
            Response: An HTTP response object with an appropriate status code to indicate the success or failure of the label update operation.
        """
        ruleset = self.get_object()
        rules_labels_data = request.data

        with transaction.atomic():
            for rule_uuid, label_ids in rules_labels_data.items():
                try:
                    rule: Rules = get_object_or_404(
                        Rules, uuid=rule_uuid, ruleset=ruleset)
                except Http404:
                    raise RuleNotFoundException()
                rule.assigned_labels.clear()
                if label_ids:
                    try:
                        labels = get_list_or_404(Label, id__in=label_ids)
                    except Http404:
                        raise LabelNotFoundException()
                    rule.assigned_labels.set(labels)

        return Response(status=status.HTTP_200_OK)
