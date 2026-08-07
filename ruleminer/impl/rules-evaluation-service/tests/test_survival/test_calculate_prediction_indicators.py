import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_survival
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_calculate_prediction_indicators(sample_data_survival):
    request_data = {
        "dataset_path": "test_dataset_path",
        "type": "survival",
        "ruleset": sample_data_survival["ruleset"],
        "rule_coverage": sample_data_survival["rule_coverage"],
        "prediction_config": {
            "prediction_strategy": "vote",
            'use_default_rule': True
        }
    }

    with temporary_mocked_db_storage():
        response = client.post(
            "/calculate_prediction_indicators", json=request_data)

        assert response.status_code == 200
        response_data = response.json()
        assert "type_of_problem" in response_data
        assert response_data["type_of_problem"] == "survival"
        assert "general" in response_data
        assert "ibs" in response_data["general"]
