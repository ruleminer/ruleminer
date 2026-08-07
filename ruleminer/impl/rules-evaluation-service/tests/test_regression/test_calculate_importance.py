import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_regression
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_calculate_importance(sample_data_regression):
    request_data = {
        "dataset_path": "test_dataset_path",
        "type": "regression",
        "measure": "correlation",
        "voting_measure": "C2",
        "ruleset": sample_data_regression["ruleset"],
        "rule_coverage": sample_data_regression["rule_coverage"]
    }
    with temporary_mocked_db_storage():
        response = client.post("/calculate_importance", json=request_data)
        assert response.status_code == 200

        response_data = response.json()
        assert isinstance(response_data, dict)
        assert "condition_importance" in response_data
        assert "attribute_importance" in response_data

        condition_importance = response_data["condition_importance"]
        attribute_importance = response_data["attribute_importance"]

        assert isinstance(condition_importance, dict)
        assert isinstance(attribute_importance, dict)
        for value in condition_importance.values():
            assert isinstance(value, (float, int)) or value == '-inf'

        for value in attribute_importance.values():
            assert isinstance(value, (float, int)) or value == '-inf'
