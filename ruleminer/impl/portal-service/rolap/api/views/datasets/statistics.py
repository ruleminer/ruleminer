from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models.datasets import ColumnStatistics
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.datasets import Statistic
from rolap.api.models.datasets import StatisticsHeader
from rolap.api.models.datasets import StatisticsResponse
from rolap.api.serializers.datasets import DatasetSummaryResponseSerializer
from rolap.api.serializers.datasets import StatisticsResponseSerializer
from rolap.api.views.base import DatasetBaseView


class StatisticsView(DatasetBaseView):
    """
        Get all statistics for the dataset
        -> mean
        -> mode
        -> min
        -> max
        -> missing value count
        Each set of statistics summarizes columns
    """

    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return StatisticsResponseSerializer(many=True)

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="dataset_statistics")

    def get(self, *args, **kwargs):
        dataset: Dataset = self.get_object()

        dataset_attributes: list[DatasetAttributes] = DatasetAttributes.objects.filter(
            dataset=dataset)

        headers: list[StatisticsHeader] = [
            StatisticsHeader(name="mean", description_id="statistic_mean"),
            StatisticsHeader(name="max", description_id="statistic_max"),
            StatisticsHeader(name="min", description_id="statistic_min"),
            StatisticsHeader(name="missing_values_count",
                             description_id="statistic_missing_values_count"),
            StatisticsHeader(name="mode", description_id="statistic_mode")
        ]

        columns: list[ColumnStatistics] = [
            ColumnStatistics(
                statistics=[
                    Statistic(name="mean", value=data_attribute.average),
                    Statistic(name="max", value=data_attribute.max),
                    Statistic(name="min", value=data_attribute.min),
                    Statistic(name="missing_values_count",
                              value=data_attribute.missing_values_count),
                    Statistic(name="mode", value=data_attribute.mode)
                ],
                column_name=data_attribute.name,
                column_role=data_attribute.role,
            ) for data_attribute in dataset_attributes
        ]
        summary = {
            "number_of_rows": dataset.number_of_rows,
            "number_of_columns": dataset.number_of_columns
        }

        response: StatisticsResponse = StatisticsResponse(
            headers=headers,
            columns=columns,
            summary=summary
        )

        serialized_response = StatisticsResponseSerializer(
            response, many=False)
        return Response(serialized_response.data)


class DatasetSummaryView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return DatasetSummaryResponseSerializer(many=False)

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="dataset_summary")

    def get(self, *args, **kwargs):
        """Return a summary of a dataset including the number of rows and columns.

        Returns:
            Response: A Response object with dataset summary or error message.
        """
        dataset: Dataset = self.get_object()
        summary: dict = {
            "number_of_rows": dataset.number_of_rows,
            "number_of_columns": dataset.number_of_columns
        }
        serialized_response = DatasetSummaryResponseSerializer(
            summary, many=False)
        return Response(serialized_response.data)
