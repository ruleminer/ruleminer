from django.urls import path
from rolap.api.views.rulesets import RuleDetailView
from rolap.api.views.rulesets import RulesetCommentsView
from rolap.api.views.rulesets import RulesetDetailEditView
from rolap.api.views.rulesets import RuleSetDetailView
from rolap.api.views.rulesets import RulesetGenerationAlgorithmParamsView
from rolap.api.views.rulesets import RulesetsViewSet


urlpatterns = [
    path('datasets/<int:dataset_id>/rulesets',
         RulesetsViewSet.as_view(), name="all-rulesets"),
    path('datasets/<int:dataset_id>/rulesets/<int:ruleset_id>',
         RuleSetDetailView.as_view(), name="ruleset-detail"),
    path('datasets/<int:dataset_id>/rulesets/<int:ruleset_id>/details',
         RulesetDetailEditView.as_view(), name="ruleset-object-detail"),
    path('datasets/<int:dataset_id>/rulesets/<int:ruleset_id>/rule/<uuid:rule_uuid>/details',
         RuleDetailView.as_view(), name='rule-details'),
    path('datasets/<int:dataset_id>/rulesets/<int:ruleset_id>/generation_algorithm_params',
         RulesetGenerationAlgorithmParamsView.as_view(), name="ruleset-generation-params"),
    path('datasets/<int:dataset_id>/rulesets/<int:ruleset_id>/comments',
         RulesetCommentsView.as_view(), name="ruleset-comments"),
]
