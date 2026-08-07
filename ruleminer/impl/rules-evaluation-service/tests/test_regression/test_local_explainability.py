import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_regression

client = TestClient(app)


def test_local_explainability(sample_data_regression):
    data = sample_data_regression
    example_data = {
        "examples": [{
            "RUN": 13.0,
            "SPEED1": 2.0,
            "TOTAL": 30.0,
            "SPEED2": 2.5,
            "NUMBER2": 0.0,
            "SENS": 10.0,
            "TIME": 22.39
        }],
        "type": "regression",
        "ruleset": data["ruleset"],
        "rule_coverage": data["rule_coverage"],
        "prediction_config": {
            "prediction_strategy": "vote",
            "use_default_rule": True,
            "voting_measure": "C2",
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
    assert isinstance(decision, float)

    expected_data = {
        "covering_rules": {
            "87801382-5ff7-491a-a1c8-30bcb0eae1d8": "IF TIME >= 7.04 AND RUN < 38.50 AND SPEED1 < 3.00 THEN class = {17.79} [11.68, 23.89] (p=8, n=2, P=9, N=19)"
        },
        "decision": 17.78
    }
    assert response_data == expected_data
