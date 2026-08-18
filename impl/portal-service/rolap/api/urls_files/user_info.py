from django.urls import path
from rolap.api.views.user_info import UserInfoView
from rolap.api.views.user_info import UserLanguageView
from rolap.api.views.user_info import DeleteSelfView

urlpatterns = [
    path("user_info", UserInfoView.as_view(), name="user_info"),
    path('user_language', UserLanguageView.as_view(), name='user_language'),
    path('user/delete-self/', DeleteSelfView.as_view(), name='delete_self'),
]
