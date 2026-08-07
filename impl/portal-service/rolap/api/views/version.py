import os

from django.conf import settings
from rest_framework import serializers
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.permissions import IsRolapUser


def _read_system_version() -> str:
    version_file_path: str = getattr(settings, 'VERSION_FILE_PATH')
    if not os.path.exists(version_file_path) or not os.path.isfile(version_file_path):
        raise ValueError(
            f'Version file: "{version_file_path}" does not exist. ' +
            'Failed to read system version'
        )
    with open(version_file_path, 'r', encoding='utf-8') as version_file:
        return version_file.read().strip()


class _VersionSerializer(serializers.Serializer):
    version = serializers.CharField(allow_blank=True)

    def create(self, validated_data: dict):
        raise NotImplementedError()

    def update(self, instance, validated_data):
        raise NotImplementedError()


class VersionView(RetrieveAPIView):
    """
    Get current system version.
    """
    system_version: str = _read_system_version()  # read version only once at startup

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['version']

    schema = _CustomSchema(operation_id_base="version")
    serializer_class = _VersionSerializer
    permission_classes = (AllowAny, IsRolapUser)

    def get(self, *args, **kwargs):
        """Get current system version.
        """
        serializer = _VersionSerializer({
            'version': VersionView.system_version
        })
        return Response(serializer.data)
