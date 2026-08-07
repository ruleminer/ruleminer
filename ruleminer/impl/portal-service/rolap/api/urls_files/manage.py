from django.urls import path
from rest_framework.routers import DefaultRouter
from rolap.api.views.manage import LimitGroupViewSet
from rolap.api.views.manage import ManageAlgorithmView
from rolap.api.views.manage import ManageNAAlgorithmParametersView
from rolap.api.views.manage import ManageQuestionView
from rolap.api.views.manage import ManageRuleSetImportAlgorithmView
from rolap.api.views.manage import ManageVotingMeasuresView
from rolap.api.views.manage import SubscriptionPlanViewSet
from rolap.api.views.manage import SubscriptionViewSet
from rolap.api.views.manage import ToursViewSet
from rolap.api.views.user_info import DeleteUserByAdminView

limit_group_router = DefaultRouter()
limit_group_router.register(
    r"limit_groups", LimitGroupViewSet, basename="limit-groups")

subscription_plan_router = DefaultRouter()
subscription_plan_router.register(
    r"subscription_plans", SubscriptionPlanViewSet, basename="subscription-plans")

subscription_router = DefaultRouter()
subscription_router.register(
    r"subscriptions", SubscriptionViewSet, basename="subscriptions")

algorithm_router = DefaultRouter()
algorithm_router.register(
    r"algorithms", ManageAlgorithmView, basename="algorithms")

tour_router = DefaultRouter()
tour_router.register(
    r"tours", ToursViewSet, basename="tours")

urlpatterns = [
    *algorithm_router.urls,
    path(r'questions/<int:pk>', ManageQuestionView.as_view(), name="questions"),
    path(r'na_algorithm_parameters/<int:pk>',
         ManageNAAlgorithmParametersView.as_view(), name="na-algorithm-parameters"),
    path('voting_measures',
         ManageVotingMeasuresView.as_view(), name="add-voting-measures"),
    path('import_ruleset_algorithms',
         ManageRuleSetImportAlgorithmView.as_view(), name="add-import-ruleset-algorithms"),
    *limit_group_router.urls,
    *subscription_plan_router.urls,
    *subscription_router.urls,
    *subscription_router.urls,
    *tour_router.urls,
    path('delete_user', DeleteUserByAdminView.as_view(), name="delete_user"),
]
