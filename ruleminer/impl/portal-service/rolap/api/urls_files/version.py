from django.urls import path
from rolap.api.views.version import VersionView


urlpatterns = [
    path('version', VersionView.as_view(), name='version')
]
