from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import UnsupportedDownloadFileTypeException
from rolap.api.models import Dataset
from rolap.api.models import Ruleset
from rolap.api.models.indicators import CalculatePredictionRequest
from rolap.api.serializers.rulesets.rulesets import RequestRulesetSerializer
from rolap.api.utils.http import IndicatorHttpService
from rolap.api.views.base import DatasetBaseView

from .download import DownloadViewsMixin


class DownloadDatasetPredictionView(DownloadViewsMixin, DatasetBaseView):
    """
    Download dataset as a csv file with predictions based on a provided ruleset.
    """
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['download']

        def get_request_serializer(self, path, method):
            return RequestRulesetSerializer()

    schema = _CustomSchema(operation_id_base="donwload_dataset_prediction")
    serializer_class = RequestRulesetSerializer

    def put(self, request: Request, *args, **kwargs):
        dataset: Dataset = self.get_object()

        try:
            format_type = request.query_params.get('format_type', 'csv')
            self.validate_format_type(format_type)
        except ValidationError as e:
            raise UnsupportedDownloadFileTypeException()
        request_serializer = RequestRulesetSerializer(
            data=request.data
        )
        request_serializer.is_valid(raise_exception=True)

        original_ruleset: Ruleset = get_object_or_404(
            Ruleset, pk=request_serializer.data.get('original_ruleset_id')
        )

        payload = self._create_prediction_payload(
            dataset, request_serializer, original_ruleset)

        predictions = IndicatorHttpService().calculate_prediction(payload)

        df, _ = dataset.read_dataset_from_storage()
        df['prediction'] = predictions

        return self.create_file_response(dataset, format_type, df, file_name_suffix='-prediction', index=False)

    def _create_prediction_payload(self, dataset, request_serializer, original_ruleset):
        return CalculatePredictionRequest(
            dataset_path=str(dataset.path),
            type=dataset.project.type_of_problem,
            ruleset=request_serializer.data.get('ruleset'),
            rule_coverage=request_serializer.data.get('rule_coverage'),
            prediction_config=original_ruleset.prediction_config,
        )
