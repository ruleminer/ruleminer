import pandas as pd
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetReadParams
from rolap.api.serializers.rulesets.rulesets import RuleCoveredIndicesListResponseSerializer
from rolap.api.serializers.rulesets.rulesets import RulesetFilterJSONSerializer
from rolap.api.utils.parsers import RulesetCoveredIndicesParser
from rolap.api.views.base import DatasetBaseView


class RuleCoveredIndicesView(DatasetBaseView):
    """
    Get a list of datapoints covered by each rule in the ruleset (with PostgreSQL storage).
    """
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['results_db']

        def get_response_serializer(self, path, method):
            return RuleCoveredIndicesListResponseSerializer()

        def get_request_serializer(self, path, method):
            return RulesetFilterJSONSerializer()

    schema = _CustomSchema(operation_id_base="dataset_rule_covered_indices")
    serializer_class = RulesetFilterJSONSerializer
    request_parser = RulesetCoveredIndicesParser()

    def _read_data_for_response(
            self, dataset: Dataset, params_list: list[DatasetReadParams]
    ) -> dict[str, pd.Index]:
        dataframes = {
            params.rule_id: dataset.read_dataset_from_storage(params)[0].index
            for params in params_list
        }
        return dataframes

    def post(self, request, *args, **kwargs):
        # get dataset object
        dataset: Dataset = self.get_object()
        project_type = dataset.project.type_of_problem
        # parse request data
        params: list[DatasetReadParams] = self.request_parser.parse_request_params(
            request, problem_type=project_type)
        # read datasets
        dfs = self._read_data_for_response(dataset, params)
        # prepare response
        return Response(dfs)
