import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_classification

client = TestClient(app)


def test_local_explainability(sample_data_classification):
    data = sample_data_classification
    example_data = {
        "examples": [{
            "sepallength": 5.0,
            "sepalwidth": 2.0,
            "petallength": 3.5,
            "petalwidth": 1.0
        }],
        "type": "classification",
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
    assert isinstance(decision, str)

    example_data['prediction_config']['use_default_rule'] = False
    response = client.post("/local_explainability", json=example_data)

    assert response.status_code == 200
