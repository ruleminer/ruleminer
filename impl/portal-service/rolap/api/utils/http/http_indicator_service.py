import os
from dataclasses import asdict
from dataclasses import is_dataclass
from typing import Any
from typing import Dict
from typing import List
from typing import Type
from typing import TypeVar
from typing import Union
from uuid import UUID

from http_client.http_client import HttpClient
from http_client.http_client_exceptions import CustomHTTPException
from http_client.http_client_response_parser import HttpClientResponseParser
from rolap.api.exceptions import GeneralApiException
from rolap.api.models.indicators import CalculateCharacteristicsRequest
from rolap.api.models.indicators import CalculateCoverageMatrixRequest
from rolap.api.models.indicators import CalculateHistogramRequest
from rolap.api.models.indicators import CalculateImportanceRequest
from rolap.api.models.indicators import CalculateIndicatorsRequest
from rolap.api.models.indicators import CalculatePredictionIndicatorsRequest
from rolap.api.models.indicators import CalculatePredictionIndicatorsResponse
from rolap.api.models.indicators import CalculatePredictionRequest
from rolap.api.models.indicators import CalculatePredictionSummaryRequest
from rolap.api.models.indicators import CalculatePredictionSummaryResponse
from rolap.api.models.indicators import CalculateRuleCoverageRequest
from rolap.api.models.indicators import CalculateRulesetIndicator
from rolap.api.models.indicators import CalculateRuleSimilarityRequest
from rolap.api.models.indicators import CalculateSingleRuleIndicatorsRequest
from rolap.api.models.indicators import CalculateUniqueExamplesRequest
from rolap.api.models.indicators import ClassificationRuleCoverage
from rolap.api.models.indicators import HistogramModel
from rolap.api.models.indicators import ImportanceModel
from rolap.api.models.indicators import Indicator
from rolap.api.models.indicators import LocalExplainabilityRequest
from rolap.api.models.indicators import LocalExplainabilityResponse
from rolap.api.models.indicators import QuantitativeCharacteristics
from rolap.api.models.indicators import RegressionRuleCoverage
from rolap.api.models.indicators import RuleCoverage
from rolap.api.models.indicators import SurvivalRuleCoverage
from rolap.api.models.projects import Project

T = TypeVar('T')


class IndicatorHttpService:
    def __init__(self):
        self.http_client: HttpClient = HttpClient()
        self.http_client.fill_http_client(
            os.environ["RULES_EVALUATION_SERVICE_URL"])
        self.response_parser = HttpClientResponseParser()

    def _prepare_request(self, request: Union[object, dict]) -> dict:
        if is_dataclass(request):
            return asdict(request)
        else:
            return request

    def _post(self, path: str, request: Any, response_type: Type[T], is_dict: bool = False) -> T:
        request = self._prepare_request(request)
        try:
            response = (
                self.http_client.clear_body()
                .set_path(path)
                .post(request)
            )
            parsed_response = self.response_parser.parse_with_response(
                response, response_type, is_dict
            )
            return parsed_response
        except CustomHTTPException as e:
            # if error contains error code field, then wrap it in GeneralApiException
            # so that a frontend can handle it
            if e.error_code is not None:
                new_error = GeneralApiException(
                    e.status_code, e.message, e.error_code
                )

                raise new_error from e
            raise e

    def calculate_characteristic(
        self, request: CalculateCharacteristicsRequest
    ) -> QuantitativeCharacteristics:
        return self._post(
            "/calculate_characteristic", request, QuantitativeCharacteristics
        )

    def calculate_rules_indicators(
        self, request: CalculateIndicatorsRequest
    ) -> List[CalculateRulesetIndicator]:
        parsed_response: Dict[UUID, Indicator] = self._post(
            "/calculate_rules_indicators", request, Dict[UUID, Indicator], is_dict=True)
        result_list = [
            {"rule_uuid": rule_uuid, "indicators": indicators}
            for rule_uuid, indicators in parsed_response.items()
        ]

        return result_list

    def calculate_single_rule_indicators(
        self, request: CalculateSingleRuleIndicatorsRequest
    ) -> Indicator:
        return self._post(
            "/calculate_single_rule_indicators", request, Indicator, is_dict=True)

    def calculate_rule_coverage(
        self, request: CalculateRuleCoverageRequest
    ) -> Dict[UUID, RuleCoverage]:
        project_type = request["type"]
        if project_type == Project.CLASSIFICATION:
            model = Dict[UUID, ClassificationRuleCoverage]
        elif project_type == Project.REGRESSION:
            model = Dict[UUID, RegressionRuleCoverage]
        elif project_type == Project.SURVIVAL:
            model = Dict[UUID, SurvivalRuleCoverage]
        else:
            raise ValueError(
                f'Unsupported problem type "{project_type}". '
                + f'Supported types are: {", ".join(e[0] for e in Project.TYPE_OF_PROBLEM_CHOICES)}'  # noqa
            )

        return self._post(
            "/calculate_rule_coverage", request, model, is_dict=True)

    def calculate_prediction_indicators(
        self, request: CalculatePredictionIndicatorsRequest
    ) -> CalculatePredictionIndicatorsResponse:
        return self._post("/calculate_prediction_indicators", request,
                          CalculatePredictionIndicatorsResponse, is_dict=True)

    def calculate_prediction_summary(
        self, request: CalculatePredictionSummaryRequest
    ) -> list[CalculatePredictionSummaryResponse]:
        return self._post("/calculate_prediction_summary", request, list[CalculatePredictionSummaryResponse], is_dict=True)

    def calculate_importance(
        self, request: CalculateImportanceRequest
    ) -> ImportanceModel:
        return self._post("/calculate_importance", request, ImportanceModel, is_dict=True)

    def local_explainability(
        self, request: LocalExplainabilityRequest
    ) -> LocalExplainabilityResponse:
        return self._post("/local_explainability", request, LocalExplainabilityResponse, is_dict=True)

    def calculate_prediction(self, request: CalculatePredictionRequest) -> dict:
        return self._post("/calculate_prediction", request, dict, is_dict=True)

    def calculate_histograms(
        self, request: CalculateHistogramRequest
    ) -> HistogramModel:
        return self._post(
            "/calculate_covered_examples_label_histogram", request, HistogramModel, is_dict=True)

    def calculate_rule_similarity(
        self, request: CalculateRuleSimilarityRequest
    ) -> dict:
        return self._post("/calculate_rule_similarity", request, dict, is_dict=True)

    def calculate_coverage_matrix(
        self, request: CalculateCoverageMatrixRequest
    ) -> dict:
        return self._post("/calculate_coverage_matrix", request, dict, is_dict=True)

    def calculate_unique_examples(
        self, request: CalculateUniqueExamplesRequest
    ) -> dict:
        return self._post("/calculate_unique_examples", request, dict, is_dict=True)
