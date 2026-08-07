import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_survival

client = TestClient(app)


def test_local_explainability(sample_data_survival):
    data = sample_data_survival
    example_data = {
        "examples": [{
            "AGE": 40.40,
            "SBP": 109.00,
            "DBP": 65.00,
            "BMI": 24.51,
            "CHOL": 2.88,
            "DIABETES": 0.00,
            "RXHYPER": 0.00,
            "CHID": 0.00,
            "SMOKE": 1.00,
            "DRINKING": 3.00,
            "survival_time": 22.10,
            "SMOKE1": 0.00,
            "SMOKE2": 0.00
        }],
        "type": "survival",
        "ruleset": data["ruleset"],
        "rule_coverage": data["rule_coverage"],
        "prediction_config": {
            "prediction_strategy": "vote",
            "use_default_rule": True
        }
    }
    response = client.post("/local_explainability", json=example_data)

    assert response.status_code == 200
    assert response.headers['content-type'] == 'application/json'

    response_data = response.json()[0]

    assert "covering_rules" in response_data
    assert "decision" in response_data

    covering_rules = response_data["covering_rules"]
    decision = response_data["decision"]

    assert isinstance(covering_rules, dict)
    for rule, description in covering_rules.items():
        assert isinstance(rule, str)
        assert isinstance(description, str)

    assert isinstance(decision, dict)
    assert "times" in decision and isinstance(decision["times"], list)
    assert "probabilities" in decision and isinstance(
        decision["probabilities"], list)
    assert "median_survival_time" in decision
