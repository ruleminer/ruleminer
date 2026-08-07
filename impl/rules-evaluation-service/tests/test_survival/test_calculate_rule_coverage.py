import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_survival
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_calculate_rule_coverage(sample_data_survival):
    request_data = {
        "dataset_path": "test_dataset_path",
        "type": "survival",
        "ruleset": sample_data_survival["ruleset"]
    }
    with temporary_mocked_db_storage():
        response = client.post("/calculate_rule_coverage", json=request_data)
        assert response.status_code == 200

        response_data = response.json()
        assert isinstance(response_data, dict)
        rule_uuids = [rule["uuid"]
                      for rule in request_data["ruleset"]["rules"]]
        for rule_uuid in rule_uuids:
            assert rule_uuid in response_data
            rule_data = response_data[rule_uuid]
            assert isinstance(rule_data, dict)
            assert "p" in rule_data
            assert "n" in rule_data
            assert "P" in rule_data
            assert "N" in rule_data
            assert "median_survival_time" in rule_data
            assert "median_survival_time_ci_lower" in rule_data
            assert "median_survival_time_ci_upper" in rule_data
            assert "events_count" in rule_data
            assert "censored_count" in rule_data
            assert "log_rank" in rule_data
            assert "kaplan_meier_estimator" in rule_data
            assert isinstance(rule_data["kaplan_meier_estimator"], dict)
