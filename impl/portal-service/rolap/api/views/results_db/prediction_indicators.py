from django.http import Http404
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.generics import RetrieveAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import PredictionResultNotFoundException
from rolap.api.models import PredictionResults
from rolap.api.permissions import IsRolapUser
from rolap.api.permissions import OwnerPermission
from rolap.api.serializers.results import PredictionIndicatorsSerializer
from rolap.api.views.base import UserLimitsMixin


class PredictionIndicatorsView(UserLimitsMixin, RetrieveAPIView):
    """Retrieves the prediction indicators for a given dataset and ruleset.

            Args:
                request (Request): The HTTP request object.
                dataset_id (int): The ID of the dataset.
                ruleset_id (int): The ID of the ruleset.

            Returns:
                Response: An HTTP response containing the prediction indicators.
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_db']

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return PredictionIndicatorsSerializer()

    schema = _CustomSchema(operation_id_base="prediction_indicators")
    serializer_class = PredictionIndicatorsSerializer
    permission_classes = [IsRolapUser & OwnerPermission]

    def get_object(self):
        dataset_id = self.kwargs.get('dataset_id')
        ruleset_id = self.kwargs.get('ruleset_id')
        try:
            result = get_object_or_404(
                PredictionResults, ruleset_id=ruleset_id, dataset_id=dataset_id)
        except Http404:
            raise PredictionResultNotFoundException()
        self.check_object_permissions(self.request, result)
        self.check_dataset_compliance(result.dataset)
        return result

    def get(self, *args, **kwargs):
        prediction_result: PredictionResults = self.get_object()
        indicators = prediction_result.results
        serializer = self.get_serializer(indicators)
        return Response(serializer.data, status=status.HTTP_200_OK)
