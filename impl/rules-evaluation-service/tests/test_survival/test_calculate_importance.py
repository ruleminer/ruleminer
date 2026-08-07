import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_survival
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_calculate_importance(sample_data_survival):
    request_data = {
        "dataset_path": "test_dataset_path",
        "type": "survival",
        "ruleset": sample_data_survival["ruleset"],
        "rule_coverage": sample_data_survival["rule_coverage"]
    }
    with temporary_mocked_db_storage():
        response = client.post("/calculate_importance", json=request_data)
        response_data = response.json()
        assert isinstance(response_data, dict)

        assert "condition_importance" in response_data
        assert "attribute_importance" in response_data

        condition_importance = response_data["condition_importance"]
        attribute_importance = response_data["attribute_importance"]

        assert isinstance(condition_importance, dict)
        assert isinstance(attribute_importance, dict)

        expected_attributes = ["AGE", "DBP", "SMOKE", "SBP"]
        for species in expected_attributes:
            assert species in attribute_importance

      
        
