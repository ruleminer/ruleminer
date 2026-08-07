import json
import logging

from django.core.files.uploadedfile import TemporaryUploadedFile
from django.db import transaction
from rest_framework.generics import GenericAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import InvalidRequestException
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.models import UploadDatasetRequest
from rolap.api.permissions import IsRolapUser
from rolap.api.permissions import OwnerPermission
from rolap.api.serializers.datasets import CreateDatasetResponseSerializer
from rolap.api.serializers.datasets import UploadDatasetRequestSerializer
from rolap.api.utils.factories import NewDatasetCreator
from rolap.api.views.base import UserLimitsMixin

logger: logging.Logger = logging.getLogger(__name__)


class UploadDatasetView(UserLimitsMixin, GenericAPIView):
    """
    Upload datasets controller (with PostgreSQL storage).
    """

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return CreateDatasetResponseSerializer()

        def get_request_serializer(self, path, method):
            return UploadDatasetRequestSerializer()

    schema = _CustomSchema(operation_id_base="dataset_upload")
    serializer_class = UploadDatasetRequestSerializer
    queryset = Project.objects.all()
    lookup_url_kwarg = "project_id"
    permission_classes = [IsRolapUser & OwnerPermission]

    def put(self, request: Request, *args, **kwargs):
        upload_request: UploadDatasetRequest = self._prepare_upload_request(
            request
        )
        project: Project = self.get_object()
        self.can_create_dataset(project)

        with transaction.atomic():
            dataset_creator = NewDatasetCreator(
                upload_request, project, self.limits)
            dataset: Dataset = dataset_creator.create_new_dataset()

        response_serializer = CreateDatasetResponseSerializer(dataset)
        return Response(response_serializer.data)

    def _prepare_upload_request(self, request: Request) -> UploadDatasetRequest:
        try:
            json_data = json.loads(request.data['data'])
        except Exception as error:
            logger.exception(error, exc_info=True)
            raise InvalidRequestException(str(error))
        upload_serializer = UploadDatasetRequestSerializer(data=json_data)
        upload_serializer.is_valid(raise_exception=True)
        file = self._get_file_from_request(request)
        return UploadDatasetRequest(**upload_serializer.validated_data, file=file)

    def _get_file_from_request(self, request: Request) -> TemporaryUploadedFile:
        try:
            return request.data["file"]
        except KeyError:
            raise InvalidRequestException(
                "No file could be retrieved from request.")
