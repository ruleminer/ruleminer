from django_filters import rest_framework as filters
from rolap.api.models import Project


class ProjectFilterSet(filters.FilterSet):
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")
    type_of_problem = filters.CharFilter(
        field_name="type_of_problem", lookup_expr="icontains")

    class Meta:
        model = Project
        fields = ("name", "type_of_problem", )
