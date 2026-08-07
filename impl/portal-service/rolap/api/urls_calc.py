from django.urls import include
from django.urls import path

urlpatterns = [
    path('', include('rolap.api.urls_files.download_calc')),
    path('', include('rolap.api.urls_files.results_calc')),
]
