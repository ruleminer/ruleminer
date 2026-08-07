from django.urls import path
from rolap.api.views.ruleset_generation import AlgorithmDetailView
from rolap.api.views.ruleset_generation import AlgorithmsView
from rolap.api.views.ruleset_generation import NAAlgorithmParametersView
from rolap.api.views.ruleset_generation import QuestionListView
from rolap.api.views.ruleset_generation import RuleSetGenerationView


urlpatterns = [
    path('datasets/<int:dataset_id>/ruleset_generation',
         RuleSetGenerationView.as_view(), name="ruleset-generation"),
    path('algorithm/<int:algorithm_id>/questions/',
         QuestionListView.as_view(), name='questions-for-algorithm'),
    path('algorithm/<int:algorithm_id>/<int:dataset_id>/na_algorithm_params/',
         NAAlgorithmParametersView.as_view(), name='params-for-non-advanced'),
    path('algorithm/<int:algorithm_id>/params',
         AlgorithmDetailView.as_view(), name="algorithm-detail"),
    path('algorithms',
         AlgorithmsView.as_view(), name="algorithms-for-problem")
]
