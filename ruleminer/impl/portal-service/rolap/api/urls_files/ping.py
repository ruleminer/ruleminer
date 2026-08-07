from django.urls import path
from rolap.api.views.ping import PingView

urlpatterns = [
    path('ping', PingView.as_view(), name='ping')
]
