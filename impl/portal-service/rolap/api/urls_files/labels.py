from django.urls import path
from rolap.api.views.labels import LabelListCreateView
from rolap.api.views.labels import LabelRetrieveUpdateDestroyView
from rolap.api.views.labels import RulesLabelsView

urlpatterns = [
    path('labels', LabelListCreateView.as_view(), name='label-list-create'),
    path('labels/<int:label_id>',
         LabelRetrieveUpdateDestroyView.as_view(), name='label-detail'),
    path('rulesets/<int:ruleset_id>/labels',
         RulesLabelsView.as_view(), name='rule-label'),
]
