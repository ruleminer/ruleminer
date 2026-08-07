from django.urls import path
from rolap.api.views.results_db import ConditionCoverageView
from rolap.api.views.results_db import CrossValidationView
from rolap.api.views.results_db import ImportanceView
from rolap.api.views.results_db import PredictionIndicatorsListView
from rolap.api.views.results_db import PredictionIndicatorsView
from rolap.api.views.results_db import QuantitativeCharacteristicsListView
from rolap.api.views.results_db import QuantitativeCharacteristicsView
from rolap.api.views.results_db import RuleCoverageView
from rolap.api.views.results_db import RuleCoveredIndicesView
from rolap.api.views.results_db import RuleIndicatorsView


urlpatterns = [
    path('datasets/<int:dataset_id>/rulesets/<int:ruleset_id>/prediction_indicators',
         PredictionIndicatorsView.as_view(), name="prediction-indicators"),
    path('datasets/<int:dataset_id>/rulesets/<int:ruleset_id>/quantitative_characteristic',
         QuantitativeCharacteristicsView.as_view(), name="ruleset-quantitative-characteristic"),
    path('datasets/<int:dataset_id>/rulesets/<int:ruleset_id>/importance',
         ImportanceView.as_view(), name="importance"),
    path('datasets/<int:dataset_id>/rulesets/<int:ruleset_id>/crossvalidation',
         CrossValidationView.as_view(), name="crossvalidation"),
    path('datasets/<int:dataset_id>/rulesets/<int:ruleset_id>/rules_coverage',
         RuleCoverageView.as_view(), name="rules-coverage"),
    path('datasets/<int:dataset_id>/rulesets/<int:ruleset_id>/rules_indicators',
         RuleIndicatorsView.as_view(), name="rules-indicators"),
    path('datasets/<int:dataset_id>/rules_indices',
         RuleCoveredIndicesView.as_view(), name='rule_covered_dataset_indices'),
    path('datasets/<int:dataset_id>/condition_coverage',
         ConditionCoverageView.as_view(), name='dataset_condition_coverage'),
    path('datasets/<int:dataset_id>/rulesets/quantitative_characteristics',
         QuantitativeCharacteristicsListView.as_view(), name='rulesets-quantitative-characteristics-summary'),
    path('datasets/<int:dataset_id>/rulesets/prediction_indicators',
         PredictionIndicatorsListView.as_view(), name='rulesets-prediction-indicators-summary'),
]
