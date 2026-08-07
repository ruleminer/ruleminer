from rest_framework.schemas.openapi import AutoSchema
from rest_framework.viewsets import ModelViewSet
from rolap.api.exceptions import TourNotCompletedYet
from rolap.api.models import CompletedTour
from rolap.api.permissions import IsRolapUser
from rolap.api.serializers.tours import CompletedTourSerializer


class CompletedToursView(ModelViewSet):
    """Gets and saves user's completed tours
    """

    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ["completed_tours"]

        def get_request_serializer(self, path, method):
            return CompletedTourSerializer

        def get_response_serializer(self, path, method):
            return CompletedTourSerializer(many=True)

    schema = _CustomSchema(operation_id_base="completed_tours")
    http_method_names = ["get", "post", "delete"]
    lookup_field = 'tour_name'
    serializer_class = CompletedTourSerializer
    permission_classes = [IsRolapUser, ]
    serializer_class = CompletedTourSerializer
    pagination_class = None

    def get_object(self):
        tour_name: str = self.kwargs.get('tour_name', '')
        try:
            return self.get_queryset().get(tour__name=tour_name)
        except CompletedTour.DoesNotExist as err:
            raise TourNotCompletedYet(tour_name) from err

    def perform_create(self, serializer):
        serializer.validated_data['user'] = self.request.user
        already_completed: bool = CompletedTour.objects.filter(
            tour__name=serializer.validated_data['tour']['name'], user=self.request.user
        ).exists()
        if not already_completed:
            super().perform_create(serializer)

    def get_queryset(self):
        return CompletedTour.objects.filter(user=self.request.user)
