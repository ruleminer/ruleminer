import numpy as np
from decision_rules.survival.kaplan_meier import KaplanMeierEstimator
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api import exceptions
from rolap.api.models import Dataset
from rolap.api.models import DatasetReadParams
from rolap.api.models import Project
from rolap.api.serializers.indicators.indicators import DatasetKaplanMeierSerializer
from rolap.api.views.base import DatasetBaseView


class DatasetKaplanMeierEstimatorView(DatasetBaseView):
    """
    Get Kaplan-Meier estimator for given dataset.
    """
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['results_db']

        def get_response_serializer(self, path, method):
            return DatasetKaplanMeierSerializer()

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="dataset_kaplan_meier_estimator")
    serializer_class = DatasetKaplanMeierSerializer

    def get(self, request, *args, **kwargs):
        dataset: Dataset = super().get_object()
        if dataset.project.type_of_problem != Project.SURVIVAL:
            raise exceptions.UnsupportedProblemTypeException(
                dataset.project.type_of_problem
            )
        survival_time, survival_status = self._read_data(dataset)
        estimator = KaplanMeierEstimator()
        estimator.fit(survival_time, survival_status)
        response_serializer = self.serializer_class(estimator.surv_info)
        return Response(response_serializer.data)

    def _read_data(self, dataset: Dataset) -> tuple[np.ndarray, np.ndarray]:
        survival_time_attr: str = dataset.survival_time_attribute
        survival_status_attr: str = dataset.class_attribute
        read_params = DatasetReadParams(
            columns=[survival_time_attr, survival_status_attr],
            limit=None,
            offset=0,
            sort=[],
            filters=None,
        )
        df, _ = dataset.read_dataset_from_storage(read_params)
        return df[survival_time_attr].to_numpy(), df[survival_status_attr].to_numpy()
