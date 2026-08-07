from django.urls import path
from rolap.api.views.datasets import CloneDatasetView
from rolap.api.views.datasets import CodecsListView
from rolap.api.views.datasets import DatasetAcceptedAttributeTypesView
from rolap.api.views.datasets import DatasetAttributesView
from rolap.api.views.datasets import DatasetClassDistributionView
from rolap.api.views.datasets import DatasetCorrelationMatrixView
from rolap.api.views.datasets import DatasetCountPlotView
from rolap.api.views.datasets import DatasetDetailView
from rolap.api.views.datasets import DatasetHistogramView
from rolap.api.views.datasets import DatasetKaplanMeierEstimatorView
from rolap.api.views.datasets import DatasetNominalAttributesValues
from rolap.api.views.datasets import DatasetReportListView
from rolap.api.views.datasets import DatasetReportResultView
from rolap.api.views.datasets import DatasetSplitView
from rolap.api.views.datasets import DatasetSummaryView
from rolap.api.views.datasets import GenerateDiscoveryReportView
from rolap.api.views.datasets import GenerateEDAReportView
from rolap.api.views.datasets import GeneratePredictionReportView
from rolap.api.views.datasets import ModifyDatasetView
from rolap.api.views.datasets import PreviewDatasetView
from rolap.api.views.datasets import RuleModifyDatasetView
from rolap.api.views.datasets import RulePreviewDatasetView
from rolap.api.views.datasets import StatisticsView
from rolap.api.views.datasets import UnimportantAttributesView
from rolap.api.views.datasets import UploadDatasetView

urlpatterns = [
    # upload settings
    path('datasets/get_types',
         DatasetAcceptedAttributeTypesView.as_view(), name="dataset-accepted-attribute-types"),
    path('datasets/codecs',
         CodecsListView.as_view(), name='available_codecs'),

    # upload dataset
    path('project/<int:project_id>/upload',
         UploadDatasetView.as_view(), name='upload_dataset'),

    # dataset operations
    path('datasets/<int:dataset_id>/clone',
         CloneDatasetView.as_view(), name='dataset_clone'),
    path('datasets/<int:dataset_id>/split',
         DatasetSplitView.as_view(), name='dataset_split'),

    # preview dataset
    path('datasets/<int:dataset_id>/preview',
         PreviewDatasetView.as_view(), name='preview_dataset'),
    path('datasets/<int:dataset_id>/rules_preview',
         RulePreviewDatasetView.as_view(), name='filter_dataset_by_rules'),

    # modify dataset
    path('datasets/<int:dataset_id>/modify',
         ModifyDatasetView.as_view(), name='modify_dataset'),
    path('datasets/<int:dataset_id>/rules_modify',
         RuleModifyDatasetView.as_view(), name='modify_dataset_by_rules'),

    # dataset details and statistics
    path('datasets/<int:dataset_id>',
         DatasetDetailView.as_view(), name='dataset_detail'),
    path('datasets/<int:dataset_id>/dataset_summary',
         DatasetSummaryView.as_view(), name='dataset_summary'),
    path('datasets/<int:dataset_id>/attributes',
         DatasetAttributesView.as_view(), name="dataset-attributes"),
    path('datasets/<int:dataset_id>/get_nominal_attributes_with_values',
         DatasetNominalAttributesValues.as_view(), name="dataset-nominal-attrs-values"),
    path('datasets/<int:dataset_id>/statistics',
         StatisticsView.as_view(), name='statistics'),
    path('datasets/<int:dataset_id>/correlation_matrix',
         DatasetCorrelationMatrixView.as_view(), name='dataset_correlation_matrix'),
    path('datasets/<int:dataset_id>/histogram',
         DatasetHistogramView.as_view(), name='dataset_histogram'),
    path('datasets/<int:dataset_id>/count_plot',
         DatasetCountPlotView.as_view(), name='dataset_count_plot'),
    path('datasets/<int:dataset_id>/class_distribution',
         DatasetClassDistributionView.as_view(), name='dataset_class_distribution'),
    path('datasets/<int:dataset_id>/unimportant_attributes',
         UnimportantAttributesView.as_view(), name='unimportant_attributes'),
    path('datasets/<int:dataset_id>/kaplan_meier',
         DatasetKaplanMeierEstimatorView.as_view(), name='dataset_kaplan_meier_estimator'),

    # reports and report generation
    path('datasets/<int:dataset_id>/reports',
         DatasetReportListView.as_view(), name='dataset_report_list'),
    path('datasets/<int:dataset_id>/generate_eda_report',
         GenerateEDAReportView.as_view(), name='generate_eda_report'),
    path('datasets/<int:dataset_id>/generate_prediction_report',
         GeneratePredictionReportView.as_view(), name='generate_prediction_report'),
    path('datasets/<int:dataset_id>/generate_discovery_report',
         GenerateDiscoveryReportView.as_view(), name='generate_discovery_report'),
    path('datasets/<int:dataset_id>/commit-report',
         DatasetReportResultView.as_view(), name='commit_report'),
]
