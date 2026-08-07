import pytest
from app import app
from fastapi.testclient import TestClient
from serializers.request import RuleSimilarityRequest

from .common_fixtures import sample_data_classification
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_calculate_rule_similarity(sample_data_classification):
    MEASURES = ["Jaccard", "Kulczynski", "Correlation"]
    for measure in MEASURES:
        request_data = RuleSimilarityRequest(
            dataset_path='test_dataset_path',
            type='classification',
            ruleset1=sample_data_classification["ruleset"],
            ruleset2=sample_data_classification["ruleset"],
            measure=measure,
            similarity_type="semantic"
        ).model_dump()
    with temporary_mocked_db_storage():
        response = client.post("/calculate_rule_similarity", json=request_data)
        assert response.status_code == 200
        response_data = response.json()
        assert isinstance(response_data, dict)
        rules_uuids: list[str] = [
            rule['uuid'] for rule in sample_data_classification["ruleset"]['rules']
        ]
        for rule_uuid in rules_uuids:
            assert response_data[rule_uuid][rule_uuid] == 1


def test_calculate_rule_similarity_with_invalid_rules(sample_data_classification):
    MEASURES = ["Jacard", "Kulczynski", "Correlation"]
    for measure in MEASURES:
        # Create request data with invalid ruleset
        invalid_ruleset = {}
        request_data = {
            'dataset_path': 'test_dataset_path',
            'type': 'classification',
            'ruleset1': invalid_ruleset,
            'ruleset2': sample_data_classification["ruleset"],
            'measure': measure,
            'similarity_type': "semantic"
        }
        with temporary_mocked_db_storage():
            response = client.post(
                "/calculate_rule_similarity", json=request_data)
            assert response.status_code == 422
