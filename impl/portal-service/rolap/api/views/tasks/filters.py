from django_filters import rest_framework as filters
from rolap.api.models import Task


class TaskFilterSet(filters.FilterSet):
    status = filters.CharFilter(field_name="status", lookup_expr="icontains")
    type = filters.CharFilter(field_name="type", lookup_expr="icontains")

    class Meta:
        model = Task
        fields = {
            "status": ["iexact", "in"],
            "type": ["iexact", "in"],
        }
