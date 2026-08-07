from typing import Iterable

import numpy as np
import pandas as pd
from decision_rules.survival.kaplan_meier import KaplanMeierEstimator
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api import exceptions
from rolap.api.models import Dataset
from rolap.api.models import DatasetAttributes
from rolap.api.models import DatasetReadParams
from rolap.api.models import Project
from rolap.api.serializers.rulesets.rulesets import ConditionSetSerializer
from rolap.api.utils.helper import sanitize_data
from rolap.api.utils.parsers import ConditionSetRequestParser
from rolap.api.views.base import DatasetBaseView


class ConditionCoverageView(DatasetBaseView):
    """
    Get coverage vectors for given conditions.
    """

    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['results_db']

        def get_response_serializer(self, path, method):
            return None

        def get_request_serializer(self, path, method):
            return ConditionSetSerializer()

    schema = _CustomSchema(operation_id_base="dataset_condition_coverage")

    serializer_class = ConditionSetSerializer
    request_parser = ConditionSetRequestParser()

    def post(self, request: Request, *args, **kwargs) -> Response:
        self.get_serializer(data=request.data).is_valid(raise_exception=True)
        # get dataset
        dataset: Dataset = self.get_object()
        special_attrs: dict[str, DatasetAttributes] = self._get_dataset_special_attributes(
            dataset
        )
        dataframes: list[pd.DataFrame] = self._read_dataframes(
            request, dataset, special_attrs
        )
        # prepare response data according to the problem type
        try:
            coverage_calculate_method = {
                Project.CLASSIFICATION: self._classification_coverage,
                Project.REGRESSION: self._regression_coverage,
                Project.SURVIVAL: self._survival_coverage,
            }[dataset.project.type_of_problem]
            response_data = coverage_calculate_method(
                special_attrs, dataframes
            )
        except KeyError as error:
            raise exceptions.UnsupportedProblemTypeException(
                dataset.project.type_of_problem
            ) from error
        # return response
        return Response(sanitize_data(response_data))

    def _get_dataset_special_attributes(self, dataset: Dataset) -> dict[str, DatasetAttributes]:
        # get the target attribute
        special_attributes: Iterable[DatasetAttributes] = dataset.attributes.all().exclude(
            role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE
        )
        return {
            str(attr.role): attr for attr in special_attributes
        }

    def _read_dataframes(
            self,
            request: Request,
            dataset: Dataset,
            special_attributes: dict[str, DatasetAttributes]
    ) -> list[pd.DataFrame]:
        # parse request into dataset read filters
        read_params: list[DatasetReadParams] = self.request_parser.parse_request_params(
            request
        )
        # read dataframes filtered by each condition group
        dataframes: list[pd.DataFrame] = []
        complementary = request.data.get("complementary", False)
        for params in read_params:
            params.columns = [
                attr.name for attr in special_attributes.values()
            ]
            df: pd.DataFrame
            df, _ = dataset.read_dataset_from_storage(
                params, complementary=complementary)
            dataframes.append(df)
        # given rules must cover at least one example
        if any(len(df) == 0 for df in dataframes):
            raise exceptions.NoExamplesCoveredError(
                problematic_items=[
                    i for i, df in enumerate(dataframes) if df.shape[0] == 0
                ]
            )
        return dataframes

    def _classification_coverage(
            self, special_attrs: dict[str, DatasetAttributes], dataframes: list[pd.DataFrame]
    ) -> list[dict]:
        target_attribute: DatasetAttributes = special_attrs[
            DatasetAttributes.DataAttributeRoles.CLASSIFICATION
        ]
        # prepare response dicts
        return [
            {
                key: df[target_attribute.name].value_counts(
                ).to_dict().get(key, 0)
                for key in target_attribute.unique_values
            }
            for df in dataframes
        ]

    def _regression_coverage(
            self, special_attrs: dict[str, DatasetAttributes], dataframes: list[pd.DataFrame]
    ) -> list[dict]:
        target_attribute: DatasetAttributes = special_attrs[
            DatasetAttributes.DataAttributeRoles.CLASSIFICATION
        ]
        return [
            {
                "covered_y_mean": df[target_attribute.name].mean(),
                "covered_y_std": df[target_attribute.name].std(ddof=0),
                "covered_y_min": df[target_attribute.name].min(),
                "covered_y_max": df[target_attribute.name].max(),
            }
            for df in dataframes
        ]

    def _survival_coverage(
            self,
            special_attrs: dict[str, DatasetAttributes],
            dataframes: list[pd.DataFrame]
    ) -> list[dict]:
        survival_status_attribute: str = special_attrs[
            DatasetAttributes.DataAttributeRoles.CLASSIFICATION
        ].name
        survival_time_attribute: str = special_attrs[
            DatasetAttributes.DataAttributeRoles.SURVIVAL_TIME
        ].name
        return [
            self._calculate_survival_coverage_row(
                df,
                survival_time_attribute,
                survival_status_attribute,
            )
            for df in dataframes
        ]

    def _calculate_survival_coverage_row(
            self,
            df: pd.DataFrame,
            survival_time_attr: str,
            survival_status_attr: str,
    ) -> dict:
        df = df.reset_index()
        survival_time: np.ndarray = df[survival_time_attr].to_numpy()
        survival_status: np.ndarray = df[survival_status_attr].to_numpy()
        km = KaplanMeierEstimator().fit(survival_time, survival_status)
        return {
            'kaplan_meier_estimator': km.get_dict(),
            'median_survival_time': km.median_survival_time,
            'median_survival_time_ci_lower': float(km.median_survival_time_cli.iloc[0]["prob_lower_0.95"]),
            'median_survival_time_ci_upper': float(km.median_survival_time_cli.iloc[0]["prob_upper_0.95"]),
            'events_count_sum': km.events_count_sum,
            'censored_count_sum': km.censored_count_sum,
        }
