import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_classification
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_calculate_prediction_summary(sample_data_classification):
    request_data = {
        "dataset_path": "test_dataset_path",
        "type": "classification",
        "rulesets": [
            {
                "id": id_,
                "name": "test_name",
                "ruleset": sample_data_classification["ruleset"],
                "rule_coverage": sample_data_classification["rule_coverage"],
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
            "Balanced_accuracy": 0.97,
            "F1_micro": 0.97,
            "F1_macro": 0.97,
            "F1_weighted": 0.97,
            "G_mean_micro": 0.98,
            "G_mean_macro": 0.98,
            "G_mean_weighted": 0.98,
            "Recall_micro": 0.97,
            "Recall_macro": 0.97,
            "Recall_weighted": 0.97,
            "Specificity": 1.0
        }
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
            "LR_plus": 0,
            "LR_minus": 0.0,
            "Odd_ratio": 0,
            "Relative_risk": 0,
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
        for indicators in response_data:
            assert indicators["indicators"]["general"]["Balanced_accuracy"] == expected_general["Balanced_accuracy"]
            assert indicators["indicators"]["for_classes"]["Iris-setosa"] == iris_setosa_expected_data
