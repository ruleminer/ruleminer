from django.db import models


class LimitGroup(models.Model):
    name = models.CharField(max_length=64, unique=True)
    max_rows = models.PositiveBigIntegerField()
    max_columns = models.PositiveBigIntegerField()
    max_size = models.PositiveBigIntegerField()
    max_sum_size = models.PositiveBigIntegerField()
    max_projects = models.IntegerField()
    max_datasets = models.IntegerField()
    max_rulesets = models.IntegerField()
    max_reports = models.IntegerField()
    plan = models.ForeignKey(
        "api.SubscriptionPlan", on_delete=models.SET_NULL, related_name="limit_groups", null=True)

    def __str__(self):
        return self.name
