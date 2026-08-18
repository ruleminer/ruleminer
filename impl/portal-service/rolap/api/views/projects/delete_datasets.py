from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import InvalidRequestException
from rolap.api.exceptions import MissingParameterException
from rolap.api.exceptions import MultipleDatasetsNotFoundException
from rolap.api.views.base import ProjectBaseView


class DeleteMultipleDatasetsView(ProjectBaseView):
    """
    Delete multiple datasets from a project.
    Query parameters:
    - datasets: Comma separated list of dataset ids to delete.
    """
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['projects']

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return None

        def get_operation(self, path, method):
            op = super().get_operation(path, method)
            op['parameters'].append(
                {"name": "datasets", "in": "query", "required": True, "schema": {"type": "string"}})
            return op

    schema = _CustomSchema(
        operation_id_base="project_delete_multiple_datasets")

    def delete(self, request: Request, *args, **kwargs):
        project = self.get_object()
        if "datasets" not in request.query_params:
            raise MissingParameterException("'datasets'")
        dataset_ids = request.query_params["datasets"]
        dataset_ids = dataset_ids.split(",")
        try:
            dataset_ids = [int(dataset_id) for dataset_id in dataset_ids]
        except ValueError:
            raise InvalidRequestException("Dataset IDs must be integers")
        datasets = project.datasets.filter(id__in=dataset_ids)
        retrieved_ids = datasets.values_list("id", flat=True)
        difference = set(dataset_ids) - set(retrieved_ids)
        difference = [str(i) for i in difference]
        if difference:
            raise MultipleDatasetsNotFoundException(difference)
        for dataset in datasets.all():
            dataset.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
