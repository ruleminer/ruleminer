from emag_report_models.discovery import DiscoveryClassificationReport
from emag_report_models.discovery import DiscoveryRegressionReport
from emag_report_models.discovery import DiscoverySurvivalReport
from emag_report_models.prediction import ClassificationPredictionReport
from emag_report_models.prediction import RegressionPredictionReport
from emag_report_models.prediction import SurvivalPredictionReport
from pydantic import BaseModel
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import InvalidRequestException
from rolap.api.models import Project
from rolap.api.views.base import DatasetBaseView


REPORT_TYPE_MAPPING = {
    "pa": {
        Project.CLASSIFICATION: ClassificationPredictionReport,
        Project.REGRESSION: RegressionPredictionReport,
        Project.SURVIVAL: SurvivalPredictionReport,
    },
    "kd": {
        Project.CLASSIFICATION: DiscoveryClassificationReport,
        Project.REGRESSION: DiscoveryRegressionReport,
        Project.SURVIVAL: DiscoverySurvivalReport,
    }
}


class ReportSpecificationView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['reports']

        def get_response_serializer(self, path, method):
            return None

        def get_request_serializer(self, path, method):
            return dict()

    schema = _CustomSchema(operation_id_base="report_specification")
    serializer_class = dict
    pagination_class = None

    def get(self, request: Request, *args, **kwargs):
        dataset = self.get_object()
        report_type = request.query_params.get("type")
        if report_type not in REPORT_TYPE_MAPPING:
            raise InvalidRequestException(
                f"Report type `{report_type}` is not supported")
        problem_type = dataset.project.type_of_problem
        report_class: BaseModel = REPORT_TYPE_MAPPING[report_type][problem_type]
        schema = self._get_report_schema(report_class)
        return Response(schema)

    def _get_report_schema(self, report_class: BaseModel):
        schema = report_class.get_form_schema()
        schema = list(
            filter(
                lambda entry: entry["name"] not in [
                    "dataset_settings", "problem_type"],
                schema["properties"]
            )
        )
        return schema
