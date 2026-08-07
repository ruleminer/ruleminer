from django.urls import include
from django.urls import path

urlpatterns = [
    path('', include('rolap.api.urls_files.version')),
    path('', include('rolap.api.urls_files.ping')),
    path('lists/', include('rolap.api.urls_files.lists')),
    path('', include('rolap.api.urls_files.projects')),
    path('', include('rolap.api.urls_files.datasets')),
    path('', include('rolap.api.urls_files.download')),
    path('', include('rolap.api.urls_files.rulesets')),
    path('', include('rolap.api.urls_files.ruleset_generation')),
    path('', include('rolap.api.urls_files.results_db')),
    path('', include('rolap.api.urls_files.rulesets_save')),
    path('', include('rolap.api.urls_files.tasks')),
    path('', include('rolap.api.urls_files.reports')),
    path('', include('rolap.api.urls_files.labels')),
    path('', include('rolap.api.urls_files.limits')),
    path('', include('rolap.api.urls_files.plans')),
    path('', include('rolap.api.urls_files.user_info')),
    path('', include('rolap.api.urls_files.prediction_config')),
    path('', include('rolap.api.urls_files.tours')),
    path('', include('rolap.api.urls_files.indicators_meta')),
]
