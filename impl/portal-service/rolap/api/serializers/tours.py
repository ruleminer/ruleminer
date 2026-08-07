from rest_framework import serializers
from rest_framework.exceptions import NotFound
from rolap.api.models import CompletedTour
from rolap.api.models import Tour


class TourSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tour
        fields = ['id', 'name']


class CompletedTourSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='tour.name')

    class Meta:
        model = CompletedTour
        fields = ['name']

    def create(self, validated_data):
        tour_name: str = validated_data['tour']['name']
        try:
            tour = Tour.objects.get(name=tour_name)
        except Tour.DoesNotExist as err:
            raise NotFound(
                detail=f'Tour named "{tour_name}" does not exist.') from err
        return CompletedTour.objects.create(
            user=self.context['request'].user, tour=tour
        )
