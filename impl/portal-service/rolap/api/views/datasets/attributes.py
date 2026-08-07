from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.generics import ListAPIView
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import DatasetNotFoundException
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.permissions import IsRolapUser
from rolap.api.permissions import OwnerPermission
from rolap.api.serializers.datasets import DatasetAttributeNominalValuesListSerializer
from rolap.api.serializers.datasets import DatasetAttributesSerializer
from rolap.api.serializers.datasets import DatasetsAcceptedAttributeTypesSerializer
from rolap.api.views.base import DatasetBaseView
from rolap.api.views.base import UserLimitsMixin


class DatasetAttributesView(UserLimitsMixin, ListAPIView):
    """ Retrieve attributes for the given dataset."""

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return DatasetAttributesSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="dataset_attributes")

    serializer_class = DatasetAttributesSerializer
    permission_classes = [IsRolapUser & OwnerPermission]
    pagination_class = None

    def get_queryset(self):
        dataset_id = self.kwargs["dataset_id"]
        try:
            dataset = get_object_or_404(Dataset, pk=dataset_id)
        except Http404:
            raise DatasetNotFoundException()
        self.check_object_permissions(self.request, dataset)
        self.check_dataset_compliance(dataset)
        return dataset.attributes.order_by("pk").all()


class DatasetAcceptedAttributeTypesView(GenericAPIView):
    """Show all accepted attribute data types."""
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return DatasetsAcceptedAttributeTypesSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="dataset_accepted_attributes")

    serializer_class = DatasetsAcceptedAttributeTypesSerializer
    pagination_class = None
    permission_classes = [IsAuthenticated, ]

    def get(self, *args, **kwargs):
        types = DatasetAttributes.DataAttributeTypes
        serializer = self.get_serializer({"types": types})
        return Response(serializer.data)


class DatasetNominalAttributesValues(RetrieveModelMixin, DatasetBaseView):
    """Show possible values for nominal-type (string and boolean) attributes in a given dataset."""
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return DatasetAttributeNominalValuesListSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="dataset_nominal_attributes")

    pagination_class = None
    serializer_class = DatasetAttributeNominalValuesListSerializer

    def get_serializer(self, *args, **kwargs):
        dataset: Dataset = self.get_object()
        nominal_attributes = dataset.attributes.filter(
            type=DatasetAttributes.DataAttributeTypes.CATEGORICAL
        )
        serializer = DatasetAttributeNominalValuesListSerializer(
            {"attributes": nominal_attributes})
        return serializer

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)


class UnimportantAttributesView(DatasetBaseView):
    """Retrieve unimportant attributes for the given dataset"""
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return None

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="dataset_unimportant_attributes")

    def get(self, request, dataset_id, *args, **kwargs):
        dataset: Dataset = self.get_object()
        unimportant_attributes = dataset.unimportant_attributes
        return Response(unimportant_attributes, status=status.HTTP_200_OK)
