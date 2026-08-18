import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_regression
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_calculate_prediction_summary(sample_data_regression):
    request_data = {
        "dataset_path": "test_dataset_path",
        "type": "regression",
        "rulesets": [
            {
                "id": id_,
                "name": "test_name",
                "ruleset": sample_data_regression["ruleset"],
                "rule_coverage": sample_data_regression["rule_coverage"],
            }
            for id_ in range(5)
        ],
        "prediction_configs": [
            {
                "prediction_strategy": "vote",
                "use_default_rule": True,
                "voting_measure": "Precision",
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

        expected_general = {
            "RMSE": 9.59,
            "MAE": 6.31,
            "MAPE": 0.26,
            "rRMSE": 0.27,
            "rMAE": 0.18,
            "maxError": 27.55,
            "R^2": 0.87,
            "Covered_by_prediction": 28,
            "Not_covered_by_prediction": 0,
        }
        for data in response_data:
            assert data["indicators"]["general"] == expected_general
