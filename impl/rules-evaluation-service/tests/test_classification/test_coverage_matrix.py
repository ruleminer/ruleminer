import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_classification
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_coverage_matrix(sample_data_classification):
    request_data = {
        "dataset_path": "test_dataset_path",
        "type": "classification",
        "example_indices": [0, 5, 6, 10],
        "ruleset": sample_data_classification["ruleset"],
        "rule_coverage": sample_data_classification["rule_coverage"],
        "prediction_config": {
            "prediction_strategy": "vote",
            'use_default_rule': True,
            "voting_measure": "precision",
        }
    }
    with temporary_mocked_db_storage():
        response = client.post("/calculate_coverage_matrix", json=request_data)
        assert response.status_code == 200
        response_data = response.json()

        assert 'coverage_matrix' in response_data
        assert 'prediction' in response_data
