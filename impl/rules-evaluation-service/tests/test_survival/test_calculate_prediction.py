import pandas as pd
import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import MockDatasetReader
from .common_fixtures import sample_data_survival
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_calculate_prediction(sample_data_survival):
    request_data = {
        "dataset_path": "test_dataset_path",
        "type": "survival",
        "ruleset": sample_data_survival["ruleset"],
        "rule_coverage": sample_data_survival["rule_coverage"],
        "prediction_config": {
            "prediction_strategy": "vote",
            'use_default_rule': True,
        }
    }
    with temporary_mocked_db_storage():
        df: pd.DataFrame = MockDatasetReader().read()
        request_data['example_indices'] = df.index.tolist()
        response = client.post("/calculate_prediction", json=request_data)
        assert response.status_code == 200
        response_data = response.json()
        for prediction in response_data:
            assert prediction is not None
            assert "times" in prediction and isinstance(
                prediction["times"], list)
            assert "probabilities" in prediction and isinstance(
                prediction["probabilities"], list)

            assert len(prediction["times"]) == len(prediction["probabilities"])

            for time in prediction["times"]:
                assert isinstance(time, (int, float))

            for probability in prediction["probabilities"]:
                assert isinstance(probability, float)
