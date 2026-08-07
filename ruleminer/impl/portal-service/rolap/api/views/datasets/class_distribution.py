from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import InvalidRequestException
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.views.base import DatasetBaseView


class DatasetClassDistributionView(DatasetBaseView):
    """
    Get class distribution for a dataset.
    Args: dataset_id
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return None

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="dataset_class_distribution")
    pagination_class = None

    def get(self, request, *args, **kwargs):
        # get dataset object
        dataset: Dataset = self.get_object()
        # check if dataset is a classification dataset
        if dataset.project.type_of_problem != Project.CLASSIFICATION:
            raise InvalidRequestException("This dataset is not a classification dataset, "
                                          "so it does not have a class distribution.")
        # check if class distribution is available
        if dataset.class_distribution is None:
            raise InvalidRequestException(
                "Class distribution is not available for this dataset.")
        # return class distribution
        return Response(dataset.class_distribution)
