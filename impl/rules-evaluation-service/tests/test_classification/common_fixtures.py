import os
from contextlib import contextmanager

import pandas as pd
import pytest
from rolap_data_storage.implementations.sql.storage import DBStorage


@pytest.fixture
def sample_data_classification():
    false = False
    true = True
    null = None
    return {
        "ruleset": {
            "meta": {
                "attributes": [
                    "sepallength",
                    "sepalwidth",
                    "petallength",
                    "petalwidth"
                ],
                "decision_attribute": "class",
                "decision_attribute_distribution": {
                    "Iris-setosa": 50,
                    "Iris-virginica": 50,
                    "Iris-versicolor": 50
                }
            },
            "rules": [
                {
                    "uuid": "87ba2b85-04d5-43a7-8a9b-799b420bd19e",
                    "string": "IF petallength < 2.45 THEN class = Iris-setosa",
                    "premise": {
                        "type": "compound",
                        "operator": "CONJUNCTION",
                        "subconditions": [
                            {
                                "left": null,
                                "type": "elementary_numerical",
                                "right": 2.45,
                                "negated": false,
                                "attributes": [
                                    2
                                ],
                                "left_closed": false,
                                "right_closed": false
                            }
                        ]
                    },
                    "coverage": {
                        "N": 100,
                        "P": 50,
                        "n": 0,
                        "p": 50
                    },
                    "conclusion": {
                        "value": "Iris-setosa"
                    }
                },
                {
                    "uuid": "49ae9956-69aa-476e-8525-d6fe46175515",
                    "string": "IF petallength >= 2.45 AND petalwidth < 1.75 AND petallength < 5.35 THEN class = Iris-versicolor",
                    "premise": {
                        "type": "compound",
                        "operator": "CONJUNCTION",
                        "subconditions": [
                            {
                                "left": 2.45,
                                "type": "elementary_numerical",
                                "right": null,
                                "negated": false,
                                "attributes": [
                                    2
                                ],
                                "left_closed": true,
                                "right_closed": false
                            },
                            {
                                "left": null,
                                "type": "elementary_numerical",
                                "right": 1.75,
                                "negated": false,
                                "attributes": [
                                    3
                                ],
                                "left_closed": false,
                                "right_closed": false
                            },
                            {
                                "left": null,
                                "type": "elementary_numerical",
                                "right": 5.35,
                                "negated": false,
                                "attributes": [
                                    2
                                ],
                                "left_closed": false,
                                "right_closed": false
                            }
                        ]
                    },
                    "coverage": {
                        "N": 100,
                        "P": 50,
                        "n": 3,
                        "p": 49
                    },
                    "conclusion": {
                        "value": "Iris-versicolor"
                    }
                },
                {
                    "uuid": "40be7d2a-d7c5-4200-a2fb-5f9b4ee484db",
                    "string": "IF petalwidth >= 1.75 THEN class = Iris-virginica",
                    "premise": {
                        "type": "compound",
                        "operator": "CONJUNCTION",
                        "subconditions": [
                            {
                                "left": 1.75,
                                "type": "elementary_numerical",
                                "right": null,
                                "negated": false,
                                "attributes": [
                                    3
                                ],
                                "left_closed": true,
                                "right_closed": false
                            }
                        ]
                    },
                    "coverage": {
                        "N": 100,
                        "P": 50,
                        "n": 1,
                        "p": 45
                    },
                    "conclusion": {
                        "value": "Iris-virginica"
                    }
                },
                {
                    "uuid": "e4eec473-fa4a-4568-8560-1761182201b7",
                    "string": "IF petallength >= 4.45 AND petalwidth >= 1.35 THEN class = Iris-virginica",
                    "premise": {
                        "type": "compound",
                        "operator": "CONJUNCTION",
                        "subconditions": [
                            {
                                "left": 4.45,
                                "type": "elementary_numerical",
                                "right": null,
                                "negated": false,
                                "attributes": [
                                    2
                                ],
                                "left_closed": true,
                                "right_closed": false
                            },
                            {
                                "left": 1.35,
                                "type": "elementary_numerical",
                                "right": null,
                                "negated": false,
                                "attributes": [
                                    3
                                ],
                                "left_closed": true,
                                "right_closed": false
                            }
                        ]
                    },
                    "coverage": {
                        "N": 100,
                        "P": 50,
                        "n": 18,
                        "p": 50
                    },
                    "conclusion": {
                        "value": "Iris-virginica"
                    }
                }
            ]
        },
        "rule_coverage": {
            "87ba2b85-04d5-43a7-8a9b-799b420bd19e": {
                "p": 50,
                "n": 0,
                "P": 50,
                "N": 100
            },
            "49ae9956-69aa-476e-8525-d6fe46175515": {
                "p": 49,
                "n": 3,
                "P": 50,
                "N": 100
            },
            "40be7d2a-d7c5-4200-a2fb-5f9b4ee484db": {
                "p": 45,
                "n": 1,
                "P": 50,
                "N": 100
            },
            "e4eec473-fa4a-4568-8560-1761182201b7": {
                "p": 50,
                "n": 18,
                "P": 50,
                "N": 100
            }
        },
    }


class MockDatasetReader:

    def select_columns(self, columns):
        pass

    def filter(self, *args, **kwargs):
        pass

    def read(self):
        csv_path = os.path.join(os.path.dirname(
            __file__), '..', 'test_data', 'iris.csv')
        test_data = pd.read_csv(csv_path)
        return test_data


@contextmanager
def temporary_mocked_db_storage():
    # Tutaj przekształć kod, który chcesz wykonać przed i po teście
    original_get_dataset_reader = DBStorage.get_dataset_reader
    DBStorage.get_dataset_reader = lambda self, path: MockDatasetReader()

    try:
        yield  # To jest punkt wejścia do bloku kodu testowego
    finally:
        # Tutaj przekształć kod, który chcesz wykonać po teście
        DBStorage.get_dataset_reader = original_get_dataset_reader
