import json
import os

import pandas as pd
from django.conf import settings
from django.db import transaction
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.views import APIView
from rolap.api.exceptions import InvalidRequestException
from rolap.api.exceptions import UnsupportedProblemTypeException
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.projects import Project
from rolap.api.models.results import ImportanceResults
from rolap.api.models.results import PredictionResults
from rolap.api.models.rulesets.rulesets_db import Rules
from rolap.api.models.rulesets.rulesets_db import Ruleset
from rolap.api.permissions import IsRolapUser
from rolap.api.serializers.datasets import DatasetAttributesObjectSerializer
from rolap.api.serializers.datasets import DatasetObjectSerializer
from rolap.api.serializers.example_project import \
    CreateExampleProjectResponseSerializer
from rolap.api.serializers.projects import ProjectSerializer
from rolap.api.serializers.results import ImportnanceResultSerializer
from rolap.api.serializers.results import PredicitonResultSerializer
from rolap.api.serializers.rulesets.rulesets import ExampleRulesetObjectSerializer
from rolap.api.serializers.rulesets.rulesets import RuleObjectSerializer
from rolap.api.views.base import UserLimitsMixin


class CreateExampleProjectView(UserLimitsMixin, APIView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['projects']

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return CreateExampleProjectResponseSerializer()

        def get_operation(self, path, method):
            operation = super().get_operation(path, method)
            operation["parameters"].append(
                {"name": "problem_type", "in": "query", "required": False, "schema": {"type": "string"}, "default": Project.CLASSIFICATION})
            operation["parameters"].append(
                {"name": "language", "in": "query", "required": False,
                    "schema": {"type": "string"}, "default": "en"}
            )

            return operation

    schema = _CustomSchema(operation_id_base="project_create_example")

    permission_classes = [IsRolapUser, ]

    def post(self, request: Request, *args, **kwargs) -> Response:
        """Handles POST request to create an example project with associated datasets and other related data.
        The type of problem (classification, regression, survival) determines the source of example data.

        Args:
            request (Request): The request object containing query parameters.

        Raises:
            UnsupportedProblemTypeException: If the 'problem_type' query parameter is not one of  the expected values ('classification', 'regression', 'survival'),
                                            this exception is raised.

        Returns:
            Response: HTTP response with project id
        """
        self.can_create_project()

        problem_type = request.query_params.get(
            'problem_type', Project.CLASSIFICATION)

        if problem_type not in [Project.CLASSIFICATION, Project.REGRESSION, Project.SURVIVAL]:
            raise UnsupportedProblemTypeException(problem_type)

        base_path = os.path.join(
            settings.BASE_DIR, 'example_data', problem_type)

        language = request.query_params.get("language", "en")
        valid_choices = [lang[0]
                         for lang in User.preferred_language.field.choices]
        if language not in valid_choices:
            raise InvalidRequestException(
                f"Language '{language}' is not supported")

        user = request.user
        try:
            with transaction.atomic():
                project = self._create_project(base_path, user, language)
                self._create_project_entities(base_path, project, language)
                serializer = CreateExampleProjectResponseSerializer(
                    {"project_id": project.id}
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _create_project(self, base_path, user, language):
        project_filename = f"project_{language}.json"
        project_path = os.path.join(base_path, project_filename)
        with open(project_path, 'r') as file:
            project_data = json.load(file)[0]

            original_name = project_data["name"]
            counter = 1
            while Project.objects.filter(name=project_data["name"], owner=user).exists():
                project_data["name"] = f"{original_name}_{counter}"
                counter += 1

            project_serializer = ProjectSerializer(data=project_data)
            if project_serializer.is_valid(raise_exception=True):
                return project_serializer.save(owner=user)
        raise Exception("Failed to create project")

    def _create_project_entities(self, base_path, project, language):
        entities = [
            (f'dataset_{language}.json',
             DatasetObjectSerializer, Dataset, 'project'),
            ('dataset_attributes.json', DatasetAttributesObjectSerializer,
                DatasetAttributes, 'dataset'),
            ('ruleset.json', ExampleRulesetObjectSerializer, Ruleset, 'dataset'),
            ('rules.json', RuleObjectSerializer, Rules, 'ruleset'),
            ('prediction_results.json', PredicitonResultSerializer,
             PredictionResults, 'ruleset-dataset'),
            ('importance_results.json', ImportnanceResultSerializer,
             ImportanceResults, 'ruleset-dataset')
        ]
        dataset = {}
        ruleset = {}
        column_types = {}
        for filename, serializer_class, model, parent_field in entities:
            entity_path = os.path.join(base_path, filename)
            with open(entity_path, 'r') as file:
                items = json.load(file)
                for item in items:
                    if parent_field == 'project':
                        item['project'] = project.id
                    elif parent_field == 'dataset':
                        item['dataset'] = dataset.id
                        item['generated_from_dataset'] = dataset.id
                        item['attached_to_dataset'] = dataset.id
                    elif parent_field == 'ruleset':
                        item['ruleset'] = ruleset.id
                        item['assigned_labels'] = []
                    elif parent_field == 'ruleset-dataset':
                        item['dataset'] = dataset.id
                        item['ruleset'] = ruleset.id
                    serializer = serializer_class(data=item)
                    if serializer.is_valid(raise_exception=True):
                        saved_instance = serializer.save()
                        if model == Dataset:
                            dataset: Dataset = saved_instance
                        elif model == DatasetAttributes:
                            column_types[item['name']
                                         ] = 'category' if item['type'] == 'cat' else 'float'
                        elif model == Ruleset:
                            ruleset: Ruleset = saved_instance

        dataset_csv_path = os.path.join(
            base_path, 'dataset.csv')
        df = pd.read_csv(
            dataset_csv_path, delimiter=dataset.delimiter, dtype=column_types)
        dataset.write_dataset_to_storage(df)
