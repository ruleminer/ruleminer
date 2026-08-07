from django.urls import path
from rolap.api.views.results_calc import CoverageMatrixView
from rolap.api.views.results_calc import DatasetRulesPredictionView
from rolap.api.views.results_calc import DeterminationHistogramsView
from rolap.api.views.results_calc import DeterminationImportanceView
from rolap.api.views.results_calc import DeterminationPredictionIndicatorsSummaryView
from rolap.api.views.results_calc import DeterminationPredictionIndicatorsView
from rolap.api.views.results_calc import DeterminationQuantitativeCharacteristicsView
from rolap.api.views.results_calc import DeterminationRuleCoverageView
from rolap.api.views.results_calc import DeterminationRulesIndicatorsView
from rolap.api.views.results_calc import DeterminationSingleRuleIndicatorsView
from rolap.api.views.results_calc import LocalExplainabilityView
from rolap.api.views.results_calc import MeasuresListView
from rolap.api.views.results_calc import PredictionView
from rolap.api.views.results_calc import RuleSimilarityView
from rolap.api.views.results_calc import UniqueExamplesView

urlpatterns = [
    path('<int:dataset_id>/prediction_indicators',
         DeterminationPredictionIndicatorsView.as_view(), name="prediction-indicators-determination"),
    path('<int:dataset_id>/importance',
         DeterminationImportanceView.as_view(), name="determination-importance"),
    path('<int:dataset_id>/rules_coverage',
         DeterminationRuleCoverageView.as_view(), name="rule-coverage-determination"),
    path('<int:dataset_id>/quantitative_characteristic',
         DeterminationQuantitativeCharacteristicsView.as_view(), name="quantitative-characteristic-determination"),
    path('<int:dataset_id>/rules_indicators',
         DeterminationRulesIndicatorsView.as_view(), name="determination-rules-indicators"),
    path('<int:dataset_id>/rule_indicators',
         DeterminationSingleRuleIndicatorsView.as_view(), name="determination-single-rule-indicators"),
    path('<int:dataset_id>/prediction',
         PredictionView.as_view(), name="prediction"),
    path('<int:dataset_id>/coverage_matrix',
         CoverageMatrixView.as_view(), name="coverage_matrix"),
    path('<int:dataset_id>/label_histograms',
         DeterminationHistogramsView.as_view(), name="determination-rules-histograms"),
    path('comparison_measures', MeasuresListView.as_view(), name='measures-list'),
    path('<int:dataset_id>/local_explainability',
         LocalExplainabilityView.as_view(), name="local-explainability"),
    path('<int:dataset_id>/rule_similarity',
         RuleSimilarityView.as_view(), name='rule-similarity'),
    path('<int:dataset_id>/prediction_indicators_summary',
         DeterminationPredictionIndicatorsSummaryView.as_view(), name='prediction-indicators-summary'),
    path('<int:dataset_id>/prediction_on_uploaded',
         DatasetRulesPredictionView.as_view(), name='prediction-on-uploaded'),
    path('<int:dataset_id>/unique_examples',
         UniqueExamplesView.as_view(), name='unique-examples'),
]
