from django.conf import settings
from django.db.models import Max
from django.db.models import Sum
from django.utils import timezone
from keycloak_auth.models import User
from rolap.api.models import Dataset
from rolap.api.models import LimitGroup
from rolap.api.models import Subscription


class UserLimits:
    """
    Class for extracting user limits and current space use from the database.
    Args:
        user (User): The user to extract limits for.
    """

    def __init__(self, user: User):
        self.user = user
        today = timezone.now().date()

        active_subscriptions = Subscription.objects.filter(
            user=self.user,
            start_date__lte=today,
            expiration_date__gte=today)

        self.limit_groups = LimitGroup.objects.filter(
            subscription__in=active_subscriptions
        )

        if not self.limit_groups.exists():
            self.limit_groups = LimitGroup.objects.filter(
                name=settings.KEYCLOAK_USER_ROLE)

        self.plan = getattr(self.limit_groups.order_by(
            "-max_rows").first(), "plan", None)

        self.limits = self.limit_groups.aggregate(
            max_rows=Max("max_rows"),
            max_columns=Max("max_columns"),
            max_size=Max("max_size"),
            max_sum_size=Max("max_sum_size"),
            max_projects=Max("max_projects"),
            max_datasets=Max("max_datasets"),
            max_rulesets=Max("max_rulesets"),
            max_reports=Max("max_reports"),
        )

    @property
    def max_rows(self):
        return self._get_value("max_rows")

    @property
    def max_columns(self):
        return self._get_value("max_columns")

    @property
    def max_size(self):
        return self._get_value("max_size")

    @property
    def max_sum_size(self):
        return self._get_value("max_sum_size")

    @property
    def max_projects(self):
        return self._get_value("max_projects")

    @property
    def max_datasets(self):
        return self._get_value("max_datasets")

    @property
    def max_rulesets(self):
        return self._get_value("max_rulesets")

    @property
    def max_reports(self):
        return self._get_value("max_reports")

    @property
    def space_used(self):
        return Dataset.objects.filter(project__owner=self.user).aggregate(
            space_used=Sum("size")
        )["space_used"] or 0

    def _get_value(self, key):
        if self.limits[key] is None:
            return settings.DEFAULT_LIMITS[key]
        return self.limits[key]
