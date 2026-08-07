import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_regression
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_calculate_prediction_indicators(sample_data_regression):
    request_data = {
        "dataset_path": "test_dataset_path",
        "type": "regression",
        "ruleset": sample_data_regression["ruleset"],
        "rule_coverage": sample_data_regression["rule_coverage"],
        "prediction_config": {
            "prediction_strategy": "vote",
            "use_default_rule": True,
            "voting_measure": "Precision",
        }
    }
    with temporary_mocked_db_storage():
        response = client.post(
            "/calculate_prediction_indicators", json=request_data)

        assert response.status_code == 200
        response_data = response.json()
        expected_data = {
            "type_of_problem": "regression",
            "general": {
                "RMSE": 9.59,
                "MAE": 6.31,
                "MAPE": 0.26,
                "rRMSE": 0.27,
                "rMAE": 0.18,
                "maxError": 27.55,
                "R^2": 0.87,
                "Covered_by_prediction": 28,
                "Not_covered_by_prediction": 0,
            },
            'histogram': {
                'max': 27.55,
                'min': -17.33,
                'bin_edges': [-17.33, -13.25, -9.17, -5.09, -1.01, 3.07, 7.15, 11.23, 15.31, 19.39, 23.47, 27.55],
                'histogram': [2, 2, 2, 4, 13, 1, 0, 2, 0, 0, 2]
            }
        }

        assert response_data == expected_data
