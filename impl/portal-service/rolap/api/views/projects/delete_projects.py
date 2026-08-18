from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.views import APIView
from rolap.api.exceptions import InvalidRequestException
from rolap.api.exceptions import MissingParameterException
from rolap.api.exceptions import MultipleProjectsNotFoundException
from rolap.api.models import Project
from rolap.api.permissions import IsRolapUser


class DeleteMultipleProjectsView(APIView):
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
                {"name": "projects", "in": "query", "required": True, "schema": {"type": "string"}})
            return op

    schema = _CustomSchema(
        operation_id_base="project_delete_multiple_projects")
    permission_classes = [IsRolapUser, ]

    def delete(self, request: Request, *args, **kwargs):
        if "projects" not in request.query_params:
            raise MissingParameterException("'projects'")
        project_ids = request.query_params["projects"]
        project_ids = project_ids.split(",")
        try:
            project_ids = [int(project_id) for project_id in project_ids]
        except ValueError:
            raise InvalidRequestException("Project IDs must be integers")
        projects = Project.objects.filter(
            owner=request.user, id__in=project_ids)
        retrieved_ids = projects.values_list("id", flat=True)
        difference = set(project_ids) - set(retrieved_ids)
        difference = [str(i) for i in difference]
        if difference:
            raise MultipleProjectsNotFoundException(difference)
        for project in projects.all():
            project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
