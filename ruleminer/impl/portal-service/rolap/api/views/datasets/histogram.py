import numpy as np
import pandas as pd
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import ExcessiveNumberOfBinsException
from rolap.api.exceptions import NumericAttributeNotFoundException
from rolap.api.models import Dataset
from rolap.api.models import DatasetAttributes
from rolap.api.serializers.datasets import DatasetHistogramSerializer
from rolap.api.views.base import DatasetBaseView

MIN_BINS: int = 2
MAX_BINS: int = 50


class DatasetHistogramView(DatasetBaseView):
    """
    View to get histogram data for a dataset as lists of counts and division,
    to draw elsewhere.
    Args: dataset_id
    Query params: bins
    Query params: attributes
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return DatasetHistogramSerializer()

        def get_request_serializer(self, path, method):
            return None

        def get_operation(self, path, method):
            op = super().get_operation(path, method)
            op['parameters'].append(
                {"name": "bins", "in": "query", "required": False, "schema": {"type": "integer"}})
            op['parameters'].append(
                {"name": "attributes", "in": "query", "required": False, "schema": {"type": "string"},
                 "description": "Comma-separated list of attributes names. By default, all numeric attributes will be used."
                 })
            return op

    schema = _CustomSchema(operation_id_base="dataset_histogram")
    pagination_class = None

    def _filter_attributes(
        self,
        numeric_attributes: list[str]
    ) -> list[str]:
        selected_attributes: str = self.request.query_params.get("attributes")
        # if not attributes selected - use all available numeric attributes
        if selected_attributes is None:
            return numeric_attributes
        selected_attributes: list[str] = (
            selected_attributes.split(",")
            if selected_attributes is not None else None
        )
        selected_attributes_set: set[str] = set(selected_attributes)
        numeric_attributes_set: set[str] = set(numeric_attributes)
        filtered_attributes_set: set[str] = numeric_attributes_set.intersection(
            set(selected_attributes_set)
        )
        attributes_not_found: list[str] = selected_attributes_set.difference(
            filtered_attributes_set
        )
        if len(attributes_not_found) > 0:
            raise NumericAttributeNotFoundException(list(attributes_not_found))
        return list(filtered_attributes_set)

    def _get_number_of_bins(self) -> tuple[int, bool]:
        bins = self.request.query_params.get("bins")
        if bins is None:
            return None, True
        bins = int(bins)
        if bins < MIN_BINS or bins > MAX_BINS:
            raise ExcessiveNumberOfBinsException(MIN_BINS, MAX_BINS)
        return bins, False

    def _prepare_histogram_data(self, df: pd.DataFrame, attributes: list[str], bins: int, dynamic_bins: bool) -> list:
        histogram_data = []
        for attribute in attributes:
            col = df[attribute].dropna()
            if dynamic_bins:
                bins: np.ndarray = np.histogram_bin_edges(col, bins='auto')
                if len(bins) > MAX_BINS:
                    bins = MAX_BINS
                elif len(bins) < MIN_BINS:
                    bins = MIN_BINS
            counts, division = np.histogram(col, bins=bins)
            data = {
                "attribute_name": attribute,
                "counts": counts.tolist(),
                "division": division.tolist(),
            }
            histogram_data.append(data)
        return histogram_data

    def get(self, *args, **kwargs) -> Response:
        bins, dynamic_bins = self._get_number_of_bins()
        dataset = self.get_object()
        numeric_attributes = list(dataset.attributes.filter(
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL).values_list("name", flat=True))
        selected_attributes = self._filter_attributes(numeric_attributes)
        df, _ = dataset.read_dataset_from_storage()
        histogram_data = self._prepare_histogram_data(
            df, selected_attributes, bins, dynamic_bins)
        serializer = DatasetHistogramSerializer(histogram_data, many=True)
        return Response(serializer.data)
