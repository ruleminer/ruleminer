from django.urls import path
from rolap.api.views.indicators_meta import IndicatorsMetaView

urlpatterns = [
    path('indicators_meta', IndicatorsMetaView.as_view(),
         name='indicators_meta-list'),
]
