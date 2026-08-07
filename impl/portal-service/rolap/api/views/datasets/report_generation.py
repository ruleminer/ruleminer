import json

from django.contrib.contenttypes.models import ContentType
from emag_report_models import DatasetSettings
from emag_report_models.discovery import DiscoveryClassificationReport
from emag_report_models.discovery import DiscoveryRegressionReport
from emag_report_models.discovery import DiscoverySurvivalReport
from emag_report_models.prediction import ClassificationPredictionReport
from emag_report_models.prediction import RegressionPredictionReport
from emag_report_models.prediction import SurvivalPredictionReport
from pydantic import ValidationError
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import IncorrectReportParametersException
from rolap.api.exceptions import ReportExistsException
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.models import Report
from rolap.api.serializers.datasets.report_generation import DatasetEDAReportSerializer
from rolap.api.serializers.datasets.report_generation import DiscoveryReportSerializer
from rolap.api.serializers.datasets.report_generation import PredictionReportSerializer
from rolap.api.serializers.tasks import TaskResponseSerializer
from rolap.api.utils.reports import generate_eda_report_for_dataset
from rolap.api.utils.reports import generate_emag_report_for_dataset
from rolap.api.views.base import DatasetBaseView


class GenerateEDAReportView(DatasetBaseView):
    """
    Generate EDA report for the dataset.

    Args (in serializer):

        title (str): Title of the report.
    """
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['datasets']

        def get_request_serializer(self, path, method):
            return DatasetEDAReportSerializer()

        def get_response_serializer(self, path, method):
            return TaskResponseSerializer()

    serializer_class = DatasetEDAReportSerializer
    schema = _CustomSchema(operation_id_base="dataset_generate_eda_report")

    def post(self, request, *args, **kwargs):
        dataset: Dataset = self.get_object()
        self.can_create_report(dataset)
        dataset_content_type = ContentType.objects.get_for_model(dataset)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        title = serializer.validated_data["title"]
        if Report.objects.filter(content_type=dataset_content_type, object_id=dataset.id, title=title).exists():
            raise ReportExistsException()
        task = generate_eda_report_for_dataset(dataset, title)
        response_serializer = TaskResponseSerializer(task)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class GenerateEmagReportBaseView(DatasetBaseView):
    REPORT_MAPPING = {}

    def post(self, request: Request, *args, **kwargs):
        dataset: Dataset = self.get_object()
        self.can_create_report(dataset)
        problem_type = dataset.project.type_of_problem
        dataset_content_type = ContentType.objects.get_for_model(dataset)
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except DRFValidationError:
            raise IncorrectReportParametersException()
        title = serializer.validated_data["title"]
        if Report.objects.filter(content_type=dataset_content_type, object_id=dataset.id, title=title).exists():
            raise ReportExistsException()
        report_class = self.REPORT_MAPPING[problem_type]
        if problem_type == Project.SURVIVAL:
            attribute = json.dumps(
                {"event": dataset.class_attribute, "time": dataset.survival_time_attribute})
        else:
            attribute = dataset.class_attribute
        try:
            report = report_class(
                **serializer.validated_data,
                dataset=DatasetSettings(
                    name=dataset.name,
                    class_attribute=attribute,
                ),
                problem_type=problem_type,
            )
        except ValidationError as e:
            raise IncorrectReportParametersException() from e
        task = generate_emag_report_for_dataset(
            dataset, report)
        response_serializer = TaskResponseSerializer(task)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class GeneratePredictionReportView(GenerateEmagReportBaseView):
    REPORT_MAPPING = {
        Project.CLASSIFICATION: ClassificationPredictionReport,
        Project.REGRESSION: RegressionPredictionReport,
        Project.SURVIVAL: SurvivalPredictionReport,
    }

    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['datasets']

        def get_request_serializer(self, path, method):
            return PredictionReportSerializer()

        def get_response_serializer(self, path, method):
            return TaskResponseSerializer()

    serializer_class = PredictionReportSerializer
    schema = _CustomSchema(
        operation_id_base="dataset_generate_prediction_report")


class GenerateDiscoveryReportView(GenerateEmagReportBaseView):
    REPORT_MAPPING = {
        Project.CLASSIFICATION: DiscoveryClassificationReport,
        Project.REGRESSION: DiscoveryRegressionReport,
        Project.SURVIVAL: DiscoverySurvivalReport,
    }

    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['datasets']

        def get_request_serializer(self, path, method):
            return DiscoveryReportSerializer()

        def get_response_serializer(self, path, method):
            return TaskResponseSerializer()

    serializer_class = DiscoveryReportSerializer
    schema = _CustomSchema(
        operation_id_base="dataset_generate_discovery_report")
