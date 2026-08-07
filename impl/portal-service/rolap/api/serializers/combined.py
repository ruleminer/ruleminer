from rest_framework import serializers
from rolap.api.serializers.datasets import CreateDatasetResponseSerializer
from rolap.api.serializers.datasets import UploadDatasetRequestSerializer
from rolap.api.serializers.projects import ProjectSerializer


class CreateProjectAndUploadDatasetSerializer(serializers.Serializer):
    project = ProjectSerializer()
    dataset = UploadDatasetRequestSerializer()


class CreateProjectAndUploadDatasetResponseSerializer(serializers.Serializer):
    project = ProjectSerializer()
    dataset = CreateDatasetResponseSerializer()
