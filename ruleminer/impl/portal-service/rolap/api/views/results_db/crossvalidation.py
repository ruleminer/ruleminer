from django.shortcuts import get_object_or_404
from rest_framework.generics import RetrieveAPIView
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Ruleset
from rolap.api.permissions import IsRolapUser
from rolap.api.permissions import OwnerPermission
from rolap.api.serializers.results import CrossValidationSerializer
from rolap.api.views.base import RulesetBaseView


class CrossValidationView(RulesetBaseView, RetrieveAPIView):
    """Retrieve cross-validation results for the specified dataset and ruleset."""

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_db']

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return CrossValidationSerializer()

    schema = _CustomSchema(operation_id_base="cross_validation_detail")
    serializer_class = CrossValidationSerializer
    permission_classes = [IsRolapUser & OwnerPermission]

    def get_object(self):
        ruleset: Ruleset = super().get_object()
        if ruleset.cross_validation.exists():
            cv_object = ruleset.cross_validation.first()
        else:
            cv_object = None
        return cv_object
