from django.db import IntegrityError
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.views import APIView
from rolap.api.exceptions import ProjectExistsException
from rolap.api.models import Project
from rolap.api.permissions import IsRolapUser
from rolap.api.serializers.projects import ProjectSerializer
from rolap.api.views.base import ProjectBaseView
from rolap.api.views.base import UserLimitsMixin


class ProjectListCreateView(UserLimitsMixin, APIView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['projects']

        def get_request_serializer(self, path, method):
            return ProjectSerializer()

        def get_response_serializer(self, path, method):
            return ProjectSerializer()

    schema = _CustomSchema(operation_id_base="project_list")
    permission_classes = [IsRolapUser, ]

    def get(self, request: Request) -> Response:
        """Returns a list of all projects owned by the requesting user.

        Returns:
            Response: A response containing a list of all projects owned by the requesting user or error massage if user does not have any project.

        """
        user: User = request.user
        projects: list[Project] = Project.objects.filter(
            owner=user).order_by('-last_opened_at')
        serializer: ProjectSerializer = ProjectSerializer(
            projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request: Request) -> Response:
        """Creates a new project owned by the requesting user.

        Returns:
            Response: A response containing the data of the newly created project.
        """
        self.can_create_project()

        user: User = request.user
        serializer: ProjectSerializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save(owner=user)
            except IntegrityError:
                raise ProjectExistsException()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectDetailView(ProjectBaseView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['projects']

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return ProjectSerializer()

    schema = _CustomSchema(operation_id_base="project_detail")
    serializer_class = ProjectSerializer

    def get(self, *args, **kwargs) -> Response:
        """Retrieve a single project.

        Args:
            request (Request): Request object.
            id (int): ID of the project to retrieve

        Returns:
            Response: object containing serialized project data.
        Raises:
            Project.DoesNotExist: If the user does not have such a project.
        """
        project: Project = self.get_object()
        serializer: ProjectSerializer = ProjectSerializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request: Request, *args, **kwargs) -> Response:
        """  Update a single project.

        Args:
            request (Request): Request object.
            id (int): ID of the project to update

        Returns:
            Response: object containing serialized updated project data
        Raises:
            Project.DoesNotExist: If the user does not have such a project.
        """
        project: Project = self.get_object()
        serializer: ProjectSerializer = ProjectSerializer(
            project, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save()
            except IntegrityError:
                raise ProjectExistsException()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, *args, **kwargs) -> Response:
        """ Delete a single project.

        Args:
            request (Request): Request object.
            id (int): ID of the project to delete.

        Returns:
            Response: object with status code 204 indicating the project was successfully deleted.
        Raises:
            Project.DoesNotExist: If the user does not have such a project.
        """
        project: Project = self.get_object()
        project.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
