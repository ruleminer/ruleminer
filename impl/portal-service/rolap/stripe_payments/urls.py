from django.urls import path
from rolap.stripe_payments.views.cancel_subscription import CancelSubscriptionView
from rolap.stripe_payments.views.webhook import stripe_webhook

urlpatterns = [
    path('webhook', stripe_webhook, name='stripe_webhook'),
    path('cancel_subscription', CancelSubscriptionView.as_view(),
         name='cancel-subscription')

]
