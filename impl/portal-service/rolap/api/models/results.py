from django.db import models
from rolap.api.models.datasets import Dataset
from rolap.api.models.rulesets.rulesets_db import Ruleset


class PredictionResults(models.Model):
    id = models.AutoField(primary_key=True)
    created_at = models.DateTimeField(auto_now=True)
    results = models.JSONField()
    ruleset = models.ForeignKey(Ruleset, on_delete=models.CASCADE)
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)

    @property
    def owner(self):
        return self.dataset.project.owner


class ImportanceResults(models.Model):
    id = models.AutoField(primary_key=True)
    created_at = models.DateTimeField(auto_now=True)
    condition_importance = models.JSONField()
    attribute_importance = models.JSONField()
    ruleset = models.ForeignKey(Ruleset, on_delete=models.CASCADE)

    @property
    def owner(self):
        return self.ruleset.attached_to_dataset.project.owner
