import logging
import os
from datetime import datetime
from datetime import timezone as tz

import stripe
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rolap.api.models.limit_groups import LimitGroup
from rolap.api.models.plans import SubscriptionPlan
from rolap.api.models.subscription import Subscription

stripe.api_key = os.environ["STRIPE_TEST_SECRET"]
endpoint_secret = os.environ["STRIPE_WEBHOOK_SECRET"]

logger: logging.Logger = logging.getLogger(__name__)


def handle_new_subscription(session):
    """Create a subscription from a Stripe checkout session."""
    client_reference_id = session.get('client_reference_id')
    client_email = session.get('customer_details', {}).get('email')
    plan_id = session.get('metadata', {}).get('subscription_plan_id')
    subscription_id = session.get('subscription')
    current_period_end = session.get('expires_at')

    if not client_reference_id or not plan_id:
        logger.error("Missing client_reference_id or plan_id.")
        return False

    try:
        limit_group = LimitGroup.objects.get(plan_id=plan_id)

        start_datetime = timezone.now().date()
        # Convert timestamps to datetime in UTC, adjust to local timezone
        expiration_datetime = datetime.fromtimestamp(
            current_period_end, tz=tz.utc
        ).astimezone(timezone.get_current_timezone())

        subscription, created = Subscription.objects.get_or_create(
            subscription_id=subscription_id,
            defaults={
                'user_id': client_reference_id,
                'limit_group': limit_group,
                'start_date': start_datetime,
                'expiration_date': expiration_datetime,
                'email': client_email,

            }
        )
        if created:
            logger.info(
                f"Subscription {subscription.subscription_id} created.")
        else:
            logger.info(
                f"Subscription {subscription.subscription_id} already exists.")
        return True
    except (SubscriptionPlan.DoesNotExist, LimitGroup.DoesNotExist) as e:
        logger.exception(e, exc_info=True)
        return False


def handle_subscription_renewal(invoice):
    """Update the subscription's expiration date based on invoice data."""
    try:
        subscription_id = invoice['subscription']
        lines = invoice.get('lines', {}).get('data', [])

        if not lines:
            logger.exception("Invoice lines are empty.")
            return False

        period_end = lines[0]['period']['end']

        subscription = Subscription.objects.get(
            subscription_id=subscription_id)

        expiration_datetime = datetime.fromtimestamp(
            period_end, tz=tz.utc
        ).astimezone(timezone.get_current_timezone())

        subscription.expiration_date = expiration_datetime
        subscription.save()
        logger.info(
            f"Subscription {subscription.subscription_id} extended successfully.")
        return True
    except Subscription.DoesNotExist as error:
        logger.exception(error, exc_info=True)
        return False
    except KeyError as e:
        logger.exception(e, exc_info=True)
        return False
    except Exception as e:
        logger.exception(e, exc_info=True)
        return False


@csrf_exempt
def stripe_webhook(request):
    print("Headers:", request.headers)
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    if not sig_header:
        return HttpResponse(status=400)

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret)
    except ValueError as e:
        logger.exception(e, exc_info=True)
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.exception(e, exc_info=True)
        return HttpResponse(status=400)

    event_handlers = {
        'checkout.session.completed': lambda session: handle_new_subscription(session),
        'invoice.payment_succeeded': lambda invoice: handle_subscription_renewal(invoice)
    }

    handler = event_handlers.get(event.type)
    if handler:
        success = handler(event.data.object)
        if not success:
            return HttpResponse(status=400)
    else:
        logger.warning(f'Unhandled event type: {event.type}')
    return HttpResponse(status=200)
