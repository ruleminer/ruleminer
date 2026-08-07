import uuid

from django.db import IntegrityError
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import RulesetExistsException
from rolap.api.models import Dataset
from rolap.api.models import Ruleset
from rolap.api.serializers.rulesets.rulesets import AllRuleSetsSerializer
from rolap.api.serializers.rulesets.rulesets import RulesetCommentsSerializer
from rolap.api.serializers.rulesets.rulesets import RulesetDBSerializer
from rolap.api.serializers.rulesets.rulesets import RulesetObjectSerializer
from rolap.api.serializers.rulesets.rulesets import RulesSerializer
from rolap.api.utils.ruleset_db_helper import get_rule
from rolap.api.utils.ruleset_db_helper import get_ruleset
from rolap.api.views.base import DatasetBaseView


class RulesetsViewSet(DatasetBaseView):
    """Retrieve the list of names and identifiers of all rulesets associated with a specific dataset.

            Args:
                request (Request): The HTTP request object.
                dataset_id (int): The ID of the dataset.
            Returns:
                Response: The HTTP response containing the serialized all rulesets.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets']

        def get_response_serializer(self, path, method):
            return AllRuleSetsSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="rulesets_view_set")
    serializer_class = AllRuleSetsSerializer

    def get(self, *args, **kwargs):
        dataset: Dataset = self.get_object()
        queryset = Ruleset.objects.filter(attached_to_dataset_id=dataset.pk)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RuleSetDetailView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets']

        def get_response_serializer(self, path, method):
            return RulesetDBSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="ruleset_detail")

    def get_ruleset(self, ruleset_id: int):
        dataset: Dataset = self.get_object()
        ruleset = get_ruleset(ruleset_id, dataset.pk)
        return ruleset

    def get(self, request: Request, dataset_id: int, ruleset_id: int) -> Response:
        """Retrieve details about a specific rulesets

        Args:
            request (Request): request object.
            dataset_id (int): The ID of the dataset.
            ruleset_id (int): The ID of the rulesets.

        Returns:
            Response: The HTTP response containing the rulesets details.
        """
        ruleset: Ruleset = self.get_ruleset(ruleset_id)

        response_serializer = RulesetDBSerializer({
            "meta": ruleset.ruleset["meta"],
            "rules": ruleset.ruleset["rules"]
        })
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request: Request, dataset_id: int, ruleset_id: int) -> Response:
        ruleset = self.get_ruleset(ruleset_id)
        ruleset.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class RulesetDetailEditView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets']

        def get_request_serializer(self, path, method):
            return RulesetObjectSerializer()

        def get_response_serializer(self, path, method):
            return RulesetObjectSerializer()

    schema = _CustomSchema(operation_id_base="ruleset_detail_edit_view")

    def get_ruleset(self, ruleset_id: int):
        dataset: Dataset = self.get_object()
        ruleset = get_ruleset(ruleset_id, dataset.pk)
        return ruleset

    def get(self, request: Request, dataset_id: int, ruleset_id: int) -> Response:
        """Retrieve details of a single ruleset object.

        Args:
            request (Request): _description_
            dataset_id (int): The ID of the dataset.
            ruleset_id (int): The ID of the rulesets.

        Returns:
            Response: Response: The HTTP response containing the details of a single ruleset object.
        """
        ruleset: Ruleset = self.get_ruleset(ruleset_id)
        serializer: RulesetObjectSerializer = RulesetObjectSerializer(ruleset)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request: Request, dataset_id: int, ruleset_id: int) -> Response:
        """  Update a single ruleset object.

        Args:
            request (Request): Request object.
            dataset_id (int): The ID of the dataset.
            ruleset_id (int): The ID of the rulesets.

        Returns:
            Response: object containing serialized updated ruleset data
        """
        ruleset: Ruleset = self.get_ruleset(ruleset_id)
        serializer: RulesetObjectSerializer = RulesetObjectSerializer(
            ruleset, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save()
            except IntegrityError:
                raise RulesetExistsException()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RuleDetailView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets']

        def get_request_serializer(self, path, method):
            return RulesSerializer()

        def get_response_serializer(self, path, method):
            return RulesSerializer()

    schema = _CustomSchema(operation_id_base="rule_detail")

    def get_ruleset(self, ruleset_id: int):
        dataset: Dataset = self.get_object()
        ruleset = get_ruleset(ruleset_id, dataset.pk)
        return ruleset

    def get(self, request: Request, dataset_id: int, ruleset_id: int, rule_uuid: uuid) -> Response:
        """Retrieve details of a single rule within a ruleset associated with a dataset.

        Args:
            request (Request): The HTTP request object.
            dataset_id (int): The ID of the dataset.
            ruleset_id (int): The ID of the ruleset.
            rule_uuid (uuid): The UUID of the rule to retrieve.

        Returns:
            Response: The HTTP response containing the details of a single rule object.
        """
        ruleset: Ruleset = self.get_ruleset(ruleset_id)
        rule = get_rule(ruleset.id, rule_uuid)
        serializer: RulesSerializer = RulesSerializer(rule)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request: Request, dataset_id: int, ruleset_id: int, rule_uuid: uuid) -> Response:
        """Partially update a rule within a ruleset associated with a dataset

        Args:
            request (Request): The HTTP request object.
            dataset_id (int): The ID of the dataset.
            ruleset_id (int): The ID of the ruleset.
            rule_uuid (uuid): The UUID of the rule to update.

        Returns:
            Response: The HTTP response containing the updated rule object if successful,
                  or a bad request response with validation errors if the update fails.
        """
        ruleset: Ruleset = self.get_ruleset(ruleset_id)
        rule = get_rule(ruleset.id, rule_uuid)
        serializer: RulesSerializer = RulesSerializer(
            rule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request: Request, dataset_id: int, ruleset_id: int, rule_uuid: uuid) -> Response:
        """ Clear the "description" field of a rule within a ruleset associated with a dataset.

        Args:
            request (Request): The HTTP request object.
            dataset_id (int): The ID of the dataset.
            ruleset_id (int): The ID of the ruleset.
            rule_uuid (uuid):  The UUID of the rule to clear the "description" field.

        Returns:
            Response:  The HTTP response indicating a successful update of the "description" field
        """
        ruleset: Ruleset = self.get_ruleset(ruleset_id)
        rule = get_rule(ruleset.id, rule_uuid)
        rule.description = None
        rule.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RulesetCommentsView(DatasetBaseView, RetrieveUpdateAPIView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['rulesets']

        def get_request_serializer(self, path, method):
            return RulesetCommentsSerializer()

        def get_response_serializer(self, path, method):
            return RulesetCommentsSerializer()

    schema = _CustomSchema(operation_id_base="ruleset_comment")
    http_method_names = ("get", "patch", )
    serializer_class = RulesetCommentsSerializer

    def get_object(self):
        dataset: Dataset = super().get_object()
        ruleset_id = self.kwargs.get('ruleset_id')
        ruleset = get_ruleset(ruleset_id, dataset.pk)
        return ruleset
