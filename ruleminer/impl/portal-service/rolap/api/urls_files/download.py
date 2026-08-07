from django.urls import path
from rolap.api.views.download import DonwloadImportanceView
from rolap.api.views.download import DownloadDatasetView
from rolap.api.views.download import DownloadRuleFilteredDatasetView
from rolap.api.views.download import DownloadRulesetExampleCoverageView
from rolap.api.views.download import DownloadRulesetIndicatorsView

urlpatterns = [
    path('download/datasets/<int:dataset_id>',
         DownloadDatasetView.as_view(), name="download-dataset"),
    path('download/datasets_filtered_by_rules/<int:dataset_id>',
         DownloadRuleFilteredDatasetView.as_view(), name="download-rules-filtred-dataset"),
    path('download/ruleset_indicators/<int:ruleset_id>',
         DownloadRulesetIndicatorsView.as_view(), name="download-ruleset-indicators"),
    path('download/ruleset_example_coverage/<int:ruleset_id>',
         DownloadRulesetExampleCoverageView.as_view(), name="download-ruleset-coverage"),
    path('download/ruleset_importance/<int:ruleset_id>',
         DonwloadImportanceView.as_view(), name="download-rules-importance"),

]
