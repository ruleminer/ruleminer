from django.urls import path
from rolap.api.views.plans import SubscriptionPlanListView


urlpatterns = [
    path("subscription_plans", SubscriptionPlanListView.as_view(),
         name="subscription_plans_list"),
]
