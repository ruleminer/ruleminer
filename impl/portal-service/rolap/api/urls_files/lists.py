from django.urls import path
from rolap.api.views.results_calc.rule_indicators import \
    RuleAvailableIndicatorsListView

urlpatterns = [
    path('<int:project_id>/rule_available_indicators',
         RuleAvailableIndicatorsListView.as_view(), name='rule-available-indicators-list'),
]
