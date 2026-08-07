from django.urls import path
from rolap.api.views.rulesets.prediction_config import PredictionConfigOptionsListView
from rolap.api.views.rulesets.prediction_config import PredictionConfigView

urlpatterns = [
    path('projects/<int:project_id>/prediction_config/options',
         PredictionConfigOptionsListView.as_view(), name="prediction-config-options"),
    path('datasets/<int:dataset_id>/rulesets/<int:ruleset_id>/prediction_config',
         PredictionConfigView.as_view(), name="prediction-config"),
]
