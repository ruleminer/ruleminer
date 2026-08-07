from django.urls import path
from rolap.api.views.rulesets_save import CloneRulesetView
from rolap.api.views.rulesets_save import CommitRulesetIndicatorsView
from rolap.api.views.rulesets_save import CommitRulesetView
from rolap.api.views.rulesets_save import CopyRulesetView
from rolap.api.views.rulesets_save import CreateRulesetView
from rolap.api.views.rulesets_save import CrossValidationUploadResultView
from rolap.api.views.rulesets_save import FilterRulesetView
from rolap.api.views.rulesets_save import OverwriteRulesetView
from rolap.api.views.rulesets_save import SaveRulesetView
from rolap.api.views.rulesets_save import UploadRulesetView
from rolap.api.views.rulesets_save import VotingMeasuresListView
from rolap.api.views.rulesets_save import RulesetImportAlgorithmListView

urlpatterns = [
    path('commit_ruleset/', CommitRulesetView.as_view(),
         name="ruleset-generation-result"),
    path('commit_cross_validation/', CrossValidationUploadResultView.as_view(),
         name="cross-validation-result"),
    path('commit_indicators/', CommitRulesetIndicatorsView.as_view(),
         name="ruleset-indicators-result"),
    path('create_ruleset/',
         CreateRulesetView.as_view(), name="create-ruleset"),
    path('duplicate_ruleset/<int:ruleset_id>/',
         CloneRulesetView.as_view(), name="duplicate-ruleset"),
    path('overwrite_ruleset/<int:ruleset_id>/',
         OverwriteRulesetView.as_view(), name="overwrite-ruleset"),
    path('copy_ruleset/<int:ruleset_id>/to_dataset/<int:dataset_id>/',
         CopyRulesetView.as_view(), name="copy-ruleset"),
    path('save_ruleset/<int:ruleset_id>/',
         SaveRulesetView.as_view(), name="save-ruleset"),
    path('filter_ruleset/<int:ruleset_id>/',
         FilterRulesetView.as_view(), name="filter-ruleset"),
    path('datasets/<int:dataset_id>/upload_ruleset',
         UploadRulesetView.as_view(), name="upload-ruleset"),
    path('voting_measures',
         VotingMeasuresListView.as_view(), name="voting-measures"),
    path('project/<int:project_id>/import_ruleset_algorithms',
         RulesetImportAlgorithmListView.as_view(), name="import-ruleset-algorithms"),
]
