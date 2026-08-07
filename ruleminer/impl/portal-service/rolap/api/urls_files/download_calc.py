from django.urls import path
from rolap.api.views.download_calc import DownloadDatasetPredictionView

urlpatterns = [
    path('download/datasets_prediction/<int:dataset_id>',
         DownloadDatasetPredictionView.as_view(), name="download-dataset-prediction"),
]
