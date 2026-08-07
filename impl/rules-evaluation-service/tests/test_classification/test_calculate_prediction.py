import pandas as pd
import pytest
from app import app
from endpoints.prediction import calculate_prediction
from fastapi.testclient import TestClient
from serializers.request import PredictionConfig
from serializers.request import PredictionRequest

from .common_fixtures import MockDatasetReader
from .common_fixtures import sample_data_classification
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def _make_request_data(sample_data: dict) -> dict:
    df: pd.DataFrame = MockDatasetReader().read()

    return {
        "dataset_path": "test_dataset_path",
        "type": "classification",
        "ruleset": sample_data["ruleset"],
        "rule_coverage": sample_data["rule_coverage"],
        "prediction_config": {
            "prediction_strategy": "vote",
            "use_default_rule": True,
            "voting_measure": "Precision",
        },
        'example_indices': df.index.tolist()
    }


def test_calculate_prediction(sample_data_classification):
    with temporary_mocked_db_storage():
        request_data = _make_request_data(sample_data_classification)
        response = client.post("/calculate_prediction", json=request_data)
        assert response.status_code == 200
        response_data = response.json()
        for prediction in response_data:
            assert prediction is not None and prediction != ""
            assert isinstance(prediction, str)


def test_calculate_prediction_with_disable_default_rule(sample_data_classification):
    with temporary_mocked_db_storage():
        request_data = _make_request_data(sample_data_classification)
        request_data["prediction_config"]["use_default_rule"] = False
        # remove some rules so that some examples will be left uncovered
        request_data['ruleset']['rules'] = request_data['ruleset']['rules'][1:]
        request_data['rule_coverage'] = {
            rule['uuid']: request_data['rule_coverage'][rule['uuid']]
            for rule in request_data['ruleset']['rules']
        }
        response = client.post("/calculate_prediction", json=request_data)
        assert response.status_code == 200
        response_data = response.json()
        assert all(isinstance(prediction, str) for prediction in response_data)
        print(response_data)
        # some examples will be left uncovered, for them prediction should be empty string
        assert any(prediction == '' for prediction in response_data)
