import json
import logging

from django.core.files.uploadedfile import TemporaryUploadedFile
from django.db import IntegrityError
from django.db import transaction
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.views import APIView
from rolap.api.exceptions import InvalidRequestException
from rolap.api.exceptions import MaxNumberOfProjectsViolation
from rolap.api.exceptions import ProjectExistsException
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.models import UploadDatasetRequest
from rolap.api.permissions import IsRolapUser
from rolap.api.serializers.combined import CreateProjectAndUploadDatasetResponseSerializer
from rolap.api.serializers.combined import CreateProjectAndUploadDatasetSerializer
from rolap.api.utils.factories import NewDatasetCreator
from rolap.api.views.base import UserLimitsMixin


logger: logging.Logger = logging.getLogger(__name__)


class CreateProjectAndUploadDatasetView(UserLimitsMixin, APIView):
    """
    Combined view for creating a project and uploading a dataset.
    """

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['projects']

        def get_response_serializer(self, path, method):
            return CreateProjectAndUploadDatasetResponseSerializer()

        def get_request_serializer(self, path, method):
            return CreateProjectAndUploadDatasetSerializer()

    schema = _CustomSchema(operation_id_base="combined_project_and_dataset")
    permission_classes = [IsRolapUser]

    def post(self, request: Request, *args, **kwargs):
        serializer = self.get_serializer()
        upload_request = self._prepare_upload_request(serializer)

        self.can_create_project()

        with transaction.atomic():
            try:
                project: Project = Project.objects.create(
                    **serializer.validated_data["project"], owner=request.user)
            except IntegrityError:
                raise ProjectExistsException()
            dataset_creator = NewDatasetCreator(
                upload_request, project, self.limits)
            dataset: Dataset = dataset_creator.create_new_dataset()

        response_serializer = CreateProjectAndUploadDatasetResponseSerializer(
            {"project": project, "dataset": dataset})
        return Response(response_serializer.data)

    def get_serializer(self):
        try:
            json_data = json.loads(self.request.data['data'])
        except Exception as error:
            logger.exception(error, exc_info=True)
            raise InvalidRequestException(str(error))
        serializer = CreateProjectAndUploadDatasetSerializer(data=json_data)
        serializer.is_valid(raise_exception=True)
        return serializer

    def _prepare_upload_request(self, serializer: CreateProjectAndUploadDatasetSerializer) -> UploadDatasetRequest:
        file = self._get_file_from_request(self.request)
        return UploadDatasetRequest(**serializer.validated_data["dataset"], file=file)

    def _get_file_from_request(self, request: Request) -> TemporaryUploadedFile:
        try:
            return request.data["file"]
        except KeyError:
            raise InvalidRequestException(
                "No file could be retrieved from request.")
