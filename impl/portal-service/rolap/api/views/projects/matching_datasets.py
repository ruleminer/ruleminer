from functools import reduce

from django.db.models import Count
from django.db.models import Q
from django.db.models import QuerySet
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import DatasetNotFoundException
from rolap.api.models import Project
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.serializers.projects import MatchingAttributesRequestSerializer
from rolap.api.serializers.projects import MatchingDatasetSerializer
from rolap.api.serializers.projects import ProjectSerializer
from rolap.api.views.base import ProjectBaseView


class ProjectMatchingDatasetsView(ProjectBaseView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['projects']

        def get_request_serializer(self, path, method):
            return MatchingAttributesRequestSerializer()

        def get_response_serializer(self, path, method):
            return MatchingDatasetSerializer()

    schema = _CustomSchema(operation_id_base="project_matching_datasets")
    serializer_class = ProjectSerializer

    def post(self, request, *args, **kwargs):
        project: Project = self.get_object()
        data = MatchingAttributesRequestSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        desired_attributes: list[dict] = self._get_desired_attributes(data)
        datasets: QuerySet[Dataset] = self._get_matching_datasets(
            project, data, desired_attributes
        )
        serializer = MatchingDatasetSerializer(datasets.all(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _get_desired_attributes(
            self,
            data: MatchingAttributesRequestSerializer
    ) -> list[dict]:
        dataset_id = data.validated_data.get("dataset_id")
        try:
            dataset = get_object_or_404(Dataset, pk=dataset_id)
        except Http404 as error:
            raise DatasetNotFoundException() from error
        self.check_object_permissions(self.request, dataset)
        desired_attributes = [
            {"name": attr.name, "type": attr.type, "role": attr.role}
            for attr in dataset.attributes.all()
        ]
        return desired_attributes

    def _get_matching_datasets(
            self,
            project: Project,
            data: MatchingAttributesRequestSerializer,
            desired_attributes: list[dict],
    ) -> QuerySet[Dataset]:
        # count attributes and target column(s) separately
        attributes = [
            Q(
                attributes__name=attr['name'],
                attributes__type=attr['type'],
            )
            for attr in desired_attributes if attr['role'] == DatasetAttributes.DataAttributeRoles.ATTRIBUTE
        ]
        attribute_query = reduce(lambda x, y: x | y, attributes)
        targets = [
            Q(
                attributes__name=attr['name'],
                attributes__type=attr['type'],
            )
            for attr in desired_attributes if attr['role'] != DatasetAttributes.DataAttributeRoles.ATTRIBUTE
        ]
        target_query = reduce(lambda x, y: x | y, targets)
        datasets = (
            project.datasets
            .annotate(
                num_attributes=Count('attributes__name',
                                     distinct=True, filter=attribute_query),
                num_targets=Count('attributes__name',
                                  distinct=True, filter=target_query),
            )
        )
        if data.validated_data.get('must_contain_all_given_attributes'):
            datasets = self._get_datasets_with_all_given_attributes(
                datasets, attributes, targets,
            )
        else:
            datasets = self._get_datasets_with_any_of_given_attributes(
                datasets, attributes, targets)
        return datasets

    def _get_datasets_with_all_given_attributes(
            self, datasets: QuerySet, attributes: list[Q], targets: list[Q]
    ) -> QuerySet[Dataset]:
        """Return datasets which have all desired attributes and possibly some others.
        """
        return datasets.filter(
            # all attributes and targets must match
            num_attributes=len(attributes),
            num_targets=len(targets),
            # must have exactly desired attributes or more
            number_of_columns__gte=len(attributes) + len(targets)
        ).distinct(
            # ensure only unique datasets are returned
        )

    def _get_datasets_with_any_of_given_attributes(
            self, datasets: QuerySet, attributes: list[Q], targets: list[Q]
    ) -> QuerySet[Dataset]:
        """Return datasets which have any of the desired attributes and no others.
        """
        return datasets.filter(
            # at least one attribute must match
            num_attributes__gte=1,
            # all target columns must match
            num_targets=len(targets),
            # can't have more than desired attributes
            number_of_columns__lte=len(attributes) + len(targets)
        ).distinct(
            # ensure only unique datasets are returned
        )
