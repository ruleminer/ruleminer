import pytest
from app import app
from fastapi.testclient import TestClient
from serializers.request import QuantitativeCharacteristicRequest

from .common_fixtures import sample_data_regression
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_calculate_characteristic(sample_data_regression):
    data = sample_data_regression
    request_data = QuantitativeCharacteristicRequest(
        dataset_path='test_dataset_path',
        type='regression',
        voting_measure='precision',
        ruleset=data["ruleset"],
        rule_coverage=data["rule_coverage"],

    ).model_dump()
    with temporary_mocked_db_storage():
        response = client.post("/calculate_characteristic", json=request_data)

        assert response.status_code == 200
        assert response.headers['content-type'] == 'application/json'

        response_data = response.json()

        assert "rules_count" in response_data
        assert "avg_conditions_count" in response_data
        assert "avg_precision" in response_data
        assert "avg_coverage" in response_data
        assert "total_conditions_count" in response_data
        assert "fraction_significant" in response_data
        assert "fraction_FDR_significant" in response_data

        assert isinstance(response_data["rules_count"], int)
        assert isinstance(response_data["avg_conditions_count"], float)
        assert isinstance(response_data["avg_precision"], float)
        assert isinstance(response_data["avg_coverage"], float)
        assert isinstance(response_data["total_conditions_count"], int)
        assert isinstance(response_data["fraction_significant"], float)
        assert isinstance(response_data["fraction_FDR_significant"], float)
