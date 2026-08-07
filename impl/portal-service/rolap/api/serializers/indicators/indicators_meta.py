from rest_framework import serializers
from rolap.api.models import IndicatorMeta


class IndicatorMetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndicatorMeta
        fields = ['key', 'description_en', 'description_pl',
                  'type_of_problem', 'higher_is_better']
