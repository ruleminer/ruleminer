import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_classification
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def _make_request_data(sample_data: dict) -> dict:
    return {
        "dataset_path": "test_dataset_path",
        "type": "classification",
        "ruleset": sample_data["ruleset"],
        "rule_coverage": sample_data["rule_coverage"],
        "prediction_config": {
            "prediction_strategy": "vote",
            "use_default_rule": True,
            "voting_measure": "Precision",
        }
    }


def test_calculate_prediction_indicators(sample_data_classification):
    request_data = _make_request_data(sample_data_classification)

    with temporary_mocked_db_storage():
        response = client.post(
            "/calculate_prediction_indicators", json=request_data)

        assert response.status_code == 200
        response_data = response.json()
        expected_data = {
            "general": {
                "Balanced_accuracy": 0.97,
                "Accuracy": 0.97,
                "Cohen_kappa": 0.96,
                "F1_micro": 0.97,
                "F1_macro": 0.97,
                "F1_weighted": 0.97,
                "G_mean_micro": 0.98,
                "G_mean_macro": 0.98,
                "G_mean_weighted": 0.98,
                "Recall_micro": 0.97,
                "Recall_macro": 0.97,
                "Recall_weighted": 0.97,
                "Specificity": 1.0,
            }
        }

        assert response_data["general"]["Balanced_accuracy"] == expected_data["general"]["Balanced_accuracy"]
        assert response_data["general"]["F1_micro"] == expected_data["general"]["F1_micro"]
        assert response_data["general"]["Recall_micro"] == expected_data["general"]["Recall_micro"]

        iris_setosa_expected_data = {
            "TP": 50,
            "FP": 0,
            "TN": 100,
            "FN": 0,
            "Recall": 1.0,
            "Specificity": 1.0,
            "F1_score": 1.0,
            "G_mean": 1.0,
            "MCC": 1.0,
            "PPV": 1.0,
            "NPV": 1.0,
            "LR_plus": 0.0,
            "LR_minus": 0.0,
            "Odd_ratio": 0.0,
            "Relative_risk": 0.0,
            "Confusion_matrix": {
                "classes": [
                    "Iris-setosa",
                    "other"
                ],
                "Iris-setosa": [
                    50,
                    0
                ],
                "other": [
                    0,
                    100
                ]
            }
        }

        assert response_data["for_classes"]["Iris-setosa"] == iris_setosa_expected_data


def test_calculate_prediction_indicators_with_disable_default_rule(
        sample_data_classification
):
    request_data = _make_request_data(sample_data_classification)
    request_data['ruleset']['rules'] = request_data['ruleset']['rules'][1:2]
    request_data['rule_coverage'] = {
        rule['uuid']: request_data['rule_coverage'][rule['uuid']]
        for rule in request_data['ruleset']['rules']
    }
    with temporary_mocked_db_storage():
        response = client.post(
            "/calculate_prediction_indicators", json=request_data)
        assert response.status_code == 200
        ruleset_response = response.json()

        request_data["prediction_config"]["use_default_rule"] = False
        response = client.post(
            "/calculate_prediction_indicators", json=request_data)
        assert response.status_code == 200
        ruleset_with_disable_default_rule_response = response.json()
        assert (
            ruleset_with_disable_default_rule_response['general']['Balanced_accuracy'] !=
            ruleset_response['general']['Balanced_accuracy']
        )

# python -m pytest ./tests/test_classification/test_calculate_prediction_indicators.py
