import json

import pytest
from app import app
from fastapi.testclient import TestClient

from .common_fixtures import sample_data_regression
from .common_fixtures import temporary_mocked_db_storage

client = TestClient(app)


def test_calculate_histogram_regression(sample_data_regression):
    request_data = {
        "dataset_path": "test_dataset_path",
        "type": "regression",
        "bins": 10,
        "for_rules": ["4e27b5ad-e88c-4fdf-9d1f-1c50c2feaaa7"],
        "ruleset": sample_data_regression["ruleset"]
    }

    with temporary_mocked_db_storage():
        response = client.post(
            "/calculate_covered_examples_label_histogram", json=request_data)
        assert response.status_code == 200
        response_data = response.json()
        assert "max" in response_data
        assert "min" in response_data
        assert "bin_edges" in response_data
        assert "histograms" in response_data
        assert response_data["max"] >= 0
        assert response_data["min"] <= response_data["max"]
        assert len(response_data["bin_edges"]) == request_data["bins"] + 1
        assert isinstance(response_data["histograms"], dict)
