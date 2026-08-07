import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_regression
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_unique_examples(sample_data_regression):
    request_data = {
        "dataset_path": "test_dataset_path",
        "type": "regression",
        "ruleset": sample_data_regression["ruleset"],
    }
    with temporary_mocked_db_storage():
        response = client.post("/calculate_unique_examples", json=request_data)
        assert response.status_code == 200
        response_data = response.json()
        assert len(response_data) == len(
            sample_data_regression["ruleset"]["rules"])
        first_rule = response_data[0]
        assert "uuid" in first_rule
        assert "ids" in first_rule
        assert "p_unique" in first_rule
        assert "n_unique" in first_rule
