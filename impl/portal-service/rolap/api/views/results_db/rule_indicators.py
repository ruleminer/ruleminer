from rest_framework import status
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models import Rules
from rolap.api.models.datasets import Dataset
from rolap.api.models.projects import Project
from rolap.api.serializers.results import HistogramsSerializer
from rolap.api.serializers.results import IndicatorsSerializer
from rolap.api.serializers.results import RulesDataSerializer
from rolap.api.views.base import DatasetBaseView


class RuleIndicatorsView(DatasetBaseView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_db']

        def get_response_serializer(self, path, method):
            return RulesDataSerializer()

    schema = _CustomSchema(operation_id_base="rule_indicators")
    serializer_class = RulesDataSerializer

    def get(self, request, dataset_id, ruleset_id):
        """ Retrieve rules indicators for given a dataset and ruleset and histograms for rules if the type of problem is regression
        Args:
            dataset_id (int): The ID of the dataset.
               ruleset_id (int): The ID of the ruleset.

        Returns:
            Response: The HTTP response containing the rule indicators.
        """
        dataset: Dataset = self.get_object()
        project: Project = dataset.project
        type_of_problem: str = project.type_of_problem
        rules = Rules.objects.filter(ruleset_id=ruleset_id)
        indicators_data = []
        histograms_data = {
            "max": 0,
            "min": 0,
            "bin_edges": [],
            "histograms": {}
        }

        for rule in rules:
            indicators_data.append({
                "rule_uuid": str(rule.uuid),
                "indicators": rule.indicators
            })

            rule_histogram = rule.histogram
            if rule_histogram:
                rule_uuid = str(rule.uuid)
                histograms_data["max"] = max(
                    histograms_data["max"], rule_histogram["max"])
                histograms_data["min"] = rule_histogram["min"]
                histograms_data["bin_edges"] = rule_histogram["bin_edges"]
                histograms_data["histograms"][rule_uuid] = rule_histogram["histogram"]
        serializer_indicators = IndicatorsSerializer(
            data=indicators_data, many=True)
        serializer_indicators.is_valid(raise_exception=True)
        serializer_histograms = HistogramsSerializer(data=histograms_data)
        serializer_histograms.is_valid(raise_exception=True)
        if type_of_problem.lower() == "regression":
            data = {
                "indicators_data": indicators_data,
                "histograms_data": histograms_data
            }

        else:
            data = {
                "indicators_data": indicators_data
            }
        rule_data_serializer = RulesDataSerializer(data=data)
        rule_data_serializer.is_valid(raise_exception=True)
        return Response(rule_data_serializer.validated_data, status=status.HTTP_200_OK)
