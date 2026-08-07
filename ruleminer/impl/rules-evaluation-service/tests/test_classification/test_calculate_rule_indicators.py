import pytest
from app import app
from fastapi.testclient import TestClient
from serializers.request import RulesIndicatorsRequest
from serializers.request import SingleRuleIndicatorsRequest

from .common_fixtures import sample_data_classification
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_calculate_rules_indicators(sample_data_classification):
    request_data = RulesIndicatorsRequest(
        dataset_path="test_dataset_path",
        type="classification",
        ruleset=sample_data_classification["ruleset"],
        rule_coverage=sample_data_classification["rule_coverage"]
    ).model_dump()
    with temporary_mocked_db_storage():
        response = client.post(
            "/calculate_rules_indicators", json=request_data)
        assert response.status_code == 200
        response_data = response.json()
        assert isinstance(response_data, dict)
        for rule in request_data["ruleset"]["rules"]:
            rule_uuid = rule["uuid"]
            assert rule_uuid in response_data

            rule_data = response_data[rule_uuid]
            assert isinstance(rule_data, dict)


def test_calculate_single_rule_indicators(sample_data_classification):
    request_data = SingleRuleIndicatorsRequest(
        dataset_path="test_dataset_path",
        type="classification",
        rule=sample_data_classification["ruleset"]["rules"][0],
        attributes=sample_data_classification["ruleset"]["meta"]["attributes"],
        decision_attribute=sample_data_classification["ruleset"]["meta"]["decision_attribute"],
        survival_time_attribute=None
    ).model_dump()
    with temporary_mocked_db_storage():
        response = client.post(
            "/calculate_single_rule_indicators", json=request_data)
        assert response.status_code == 200
        response_data = response.json()
        assert isinstance(response_data, dict)
