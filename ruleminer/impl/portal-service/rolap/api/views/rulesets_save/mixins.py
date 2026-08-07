import itertools
from typing import Optional

from django.http import Http404
from django.shortcuts import get_list_or_404
from django.utils import timezone
from rolap.api.exceptions import AttributeMismatchException
from rolap.api.exceptions import DatasetAttributesNotFoundException
from rolap.api.exceptions import LabelNotFoundException
from rolap.api.exceptions import RulesetExistsException
from rolap.api.exceptions import TargetAttributeMismatchException
from rolap.api.models import Dataset
from rolap.api.models import DatasetAttributes
from rolap.api.models import ImportanceResults
from rolap.api.models import Label
from rolap.api.models import PredictionResults
from rolap.api.models import Project
from rolap.api.models import Rules
from rolap.api.models import Ruleset
from rolap.api.models import Task
from rolap.api.models.rulesets.rulesets_db import DEFAULT_MEASURE
from rolap.api.models.rulesets.rulesets_db import INDUCTION_MEASURE_PARAMETER
from rolap.api.models.rulesets.rulesets_db import VOTING_MEASURE_PARAMETER
from rolap.api.models.rulesets.worker_rulesets import Attribute


class CreateRulesetMixin:
    def validate_name(self, dataset: Dataset, name: Optional[str] = None):
        if Ruleset.objects.filter(attached_to_dataset_id=dataset, name=name or "").exists():
            raise RulesetExistsException()

    def check_attribute_match(self, ruleset: dict, dataset: Dataset):
        ruleset_attributes = ruleset["meta"]["attributes"]
        ruleset_attributes = set(ruleset_attributes)
        filtered_dataset_attributes = dataset.attributes.filter(
            name__in=ruleset_attributes).values_list("name", flat=True)
        filtered_dataset_attributes = set(filtered_dataset_attributes)
        if ruleset_attributes != filtered_dataset_attributes:
            missing_in_dataset = ruleset_attributes - filtered_dataset_attributes
            raise AttributeMismatchException(list(missing_in_dataset))
        self._check_decision_attribute_match(ruleset, dataset)

    def _check_decision_attribute_match(self, ruleset: dict, dataset: Dataset):
        decision_attribute = ruleset["meta"]["decision_attribute"]
        if not dataset.attributes.filter(name=decision_attribute, role=DatasetAttributes.DataAttributeRoles.CLASSIFICATION).exists():
            raise TargetAttributeMismatchException(decision_attribute)
        if dataset.project.type_of_problem == Project.SURVIVAL:
            survival_time_attribute = ruleset["meta"]["survival_time_attribute"]
            if not dataset.attributes.filter(name=survival_time_attribute, role=DatasetAttributes.DataAttributeRoles.SURVIVAL_TIME).exists():
                raise TargetAttributeMismatchException(survival_time_attribute)

    def get_default_algorithm_params(self):
        return {
            INDUCTION_MEASURE_PARAMETER: DEFAULT_MEASURE,
            VOTING_MEASURE_PARAMETER: DEFAULT_MEASURE
        }

    def get_default_attributes(self, dataset: Dataset):
        dataset_attributes_query = DatasetAttributes.objects.filter(
            dataset=dataset)
        dataset_attributes = dataset_attributes_query.all()
        selected_attributes = [
            {"name": x.name, "role": x.role}
            for x in dataset_attributes
        ]
        return selected_attributes

    def get_attributes(self, dataset: Dataset, ruleset: dict):
        # now we need to read dataset attributes from the database and prepare the request
        attributes = ruleset["meta"]["attributes"] + \
            [ruleset["meta"]["decision_attribute"]]
        dataset_attributes_query = DatasetAttributes.objects \
            .filter(dataset=dataset) \
            .filter(name__in=attributes)

        if not dataset_attributes_query.exists():
            raise DatasetAttributesNotFoundException()

        dataset_attributes = dataset_attributes_query.all()
        ruleset_attributes = [
            Attribute(name=x.name, role=x.role)
            for x in dataset_attributes
        ]
        return ruleset_attributes

    def validate_rules_labels(self, labels: dict[str, list[int]]):
        labels_ids: list[int] = list(itertools.chain(*labels.values()))
        if len(labels_ids) == 0:
            return
        try:
            labels = get_list_or_404(Label, id__in=labels_ids)
        except Http404 as error:
            raise LabelNotFoundException() from error


class CommitResultMixin:
    def create_rules(self, ruleset: Ruleset, statistics: dict):
        # clear old rules to avoid duplicated rules uuids
        Rules.objects.filter(ruleset=ruleset).delete()

        rule_coverage = statistics["rule_coverage"]
        rule_indicators = statistics["rule_indicators"]
        rule_histograms = statistics.get("rule_histograms")
        if rule_histograms is not None:
            histogram = {
                "min": rule_histograms.get("min", 0),
                "max": rule_histograms.get("max", 0),
                "bin_edges": rule_histograms.get("bin_edges", []),
            }
        else:
            histogram = None
        for rule_uuid, indicator in rule_indicators.items():
            if histogram is not None:
                histogram["histogram"] = rule_histograms["histograms"][rule_uuid]
            coverage = rule_coverage[rule_uuid]
            rule: Rules = Rules(
                uuid=rule_uuid,
                ruleset=ruleset,
                p=coverage["p"],
                n=coverage["n"],
                P=coverage["P"],
                N=coverage["N"],
                train_covered_y_std=coverage.get("train_covered_y_std", None),
                train_covered_y_mean=coverage.get(
                    "train_covered_y_mean", None),
                indicators=indicator,
                histogram=histogram,
                kaplan_meier_estimator=coverage.get(
                    "kaplan_meier_estimator", None)
            )
            rule.save()

    def process_results(self, ruleset: Ruleset, statistics: dict):
        importance_result = ImportanceResults.objects.filter(ruleset=ruleset)
        if importance_result.exists():
            importance_result = importance_result.get()
            importance_result.condition_importance = statistics["condition_importance"]
            importance_result.attribute_importance = statistics["attribute_importance"]
            importance_result.save()
        else:
            ImportanceResults.objects.create(
                ruleset=ruleset,
                condition_importance=statistics["condition_importance"],
                attribute_importance=statistics["attribute_importance"],
            )
        prediction_result = PredictionResults.objects.filter(ruleset=ruleset)
        if prediction_result.exists():
            prediction_result = prediction_result.get()
            prediction_result.results = statistics["prediction_indicators"]
            prediction_result.save()
        else:
            PredictionResults.objects.create(
                ruleset=ruleset,
                dataset=ruleset.attached_to_dataset,
                results=statistics["prediction_indicators"],
            )

    def process_task(self, ruleset: Ruleset, task_id: int, extra_info: Optional[dict] = None):
        task = Task.objects.get(task_id=task_id)
        # do not change to success if the task has been stopped
        if task.status == Task.TaskStatus.STOPPING:
            task.status = Task.TaskStatus.STOPPED
        else:
            task.status = Task.TaskStatus.SUCCESS
        task.finish_timestamp = timezone.now()
        task.result_object = ruleset
        if extra_info is not None:
            task.meta.update(extra_info)
        task.save()

    def save_rules_labels(self, ruleset: Ruleset, rules_labels: dict[str, list[int]]):
        for rule in ruleset.rules.all():
            rule.assigned_labels.clear()
            labels_ids = rules_labels.get(str(rule.uuid), [])
            if len(labels_ids) == 0:
                continue
            labels = Label.objects.filter(id__in=labels_ids)
            rule.assigned_labels.set(labels)
