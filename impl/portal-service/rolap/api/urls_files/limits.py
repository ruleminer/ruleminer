from django.urls import path
from rolap.api.views.limits import UserLimitView


urlpatterns = [
    path("user_limits", UserLimitView.as_view(), name="user_limits"),
]
