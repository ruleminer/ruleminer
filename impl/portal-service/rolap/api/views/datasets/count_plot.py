import pandas as pd
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Dataset
from rolap.api.models import DatasetAttributes
from rolap.api.models import DatasetReadParams
from rolap.api.serializers.datasets import DatasetCountPlotSerializer
from rolap.api.views.base import DatasetBaseView


class DatasetCountPlotView(DatasetBaseView):
    """
    View to get data for count plots for categorical attributes, to draw elsewhere.
    Args: dataset_id
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return DatasetCountPlotSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="dataset_countplot")
    pagination_class = None

    def get(self, *args, **kwargs):
        # get dataset object
        dataset: Dataset = self.get_object()
        # get numeric attributes of dataset
        categorical_attrs = dataset.attributes.filter(
            type=DatasetAttributes.DataAttributeTypes.CATEGORICAL)
        categorical_attrs = list(
            categorical_attrs.values_list("name", flat=True))
        # if there are not categorical attributes, do not read the dataset and return an empty array
        if not categorical_attrs:
            serializer = DatasetCountPlotSerializer([], many=True)
            return Response(serializer.data)
        # read dataset from storage
        read_params = DatasetReadParams(
            limit=None, offset=None, sort=[],
            columns=categorical_attrs, filters=None,
        )
        df: pd.DataFrame
        df, _ = dataset.read_dataset_from_storage(read_params)
        # prepare count plot data
        count_plot_data = []
        for attribute in categorical_attrs:
            # get value counts for attribute
            value_counts = df[attribute].dropna().value_counts()
            data = {
                "attribute_name": attribute,
                "values": value_counts.index.tolist(),
                "counts": value_counts.tolist(),
            }
            count_plot_data.append(data)
        serializer = DatasetCountPlotSerializer(count_plot_data, many=True)
        return Response(serializer.data)
