from django.db import IntegrityError
from django.db import transaction
from rest_framework import status
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.mixins import UpdateModelMixin
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import DatasetExistsException
from rolap.api.serializers.datasets import DatasetSerializer
from rolap.api.views.base import DatasetBaseView


class DatasetDetailView(RetrieveModelMixin, UpdateModelMixin, DatasetBaseView):

    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['datasets']

        def get_request_serializer(self, path, method):
            return DatasetSerializer()

        def get_response_serializer(self, path, method):
            return DatasetSerializer()

    serializer_class = DatasetSerializer
    schema = _CustomSchema(operation_id_base="dataset_detail")

    def get(self, request, *args, **kwargs):
        """Retrieve dataset metadata (name, description etc.)"""
        return self.retrieve(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        """Update dataset metadata (name, description etc.)"""
        try:
            return self.partial_update(request, *args, **kwargs)
        except IntegrityError:
            raise DatasetExistsException()

    def delete(self, request, *args, **kwargs):
        """Delete a dataset and all associated objects"""
        dataset = self.get_object()
        with transaction.atomic():
            dataset.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
