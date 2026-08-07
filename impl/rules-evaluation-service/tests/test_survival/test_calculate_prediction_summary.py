import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_survival
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_calculate_prediction_summary(sample_data_survival):
    request_data = {
        "dataset_path": "test_dataset_path",
        "type": "survival",
        "rulesets": [
            {
                "id": id_,
                "name": "test_name",
                "ruleset": sample_data_survival["ruleset"],
                "rule_coverage": sample_data_survival["rule_coverage"],
            }
            for id_ in range(5)
        ],
        "prediction_configs": [
            {
                "prediction_strategy": "vote",
                "use_default_rule": True
            }
            for _ in range(5)
        ]
    }

    with temporary_mocked_db_storage():
        response = client.post(
            "/calculate_prediction_summary", json=request_data)
        assert response.status_code == 200

        response_data = response.json()
        assert len(response_data) == 5

        for data in response_data:
            assert "general" in data["indicators"]
            assert "ibs" in data["indicators"]["general"]
