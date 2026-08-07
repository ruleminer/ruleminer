import os
from contextlib import contextmanager

import pandas as pd
import pytest
from rolap_data_storage.implementations.sql.storage import DBStorage


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


class MockDatasetReader:
    def __init__(self):
        self.columns_to_read = None

    def select_columns(self, columns: list):
        self.columns_to_read = columns

    def filter(self, *args, **kwargs):
        pass

    def read(self):
        csv_path = os.path.join(os.path.dirname(
            __file__), '..', 'test_data', 'bolts.csv')
        if self.columns_to_read:
            test_data = pd.read_csv(csv_path, usecols=self.columns_to_read)
        else:
            test_data = pd.read_csv(csv_path)
        return test_data


@pytest.fixture
def sample_data_regression():
    false = False
    true = True
    null = None
    return {
        "ruleset": {
            "meta": {
                "attributes": [
                    "RUN",
                    "SPEED1",
                    "TOTAL",
                    "SPEED2",
                    "NUMBER2",
                    "SENS",
                    "TIME"
                ],
                "y_train_median": 23.32,
                "decision_attribute": "class"
            },
            "rules": [
                {
                    "uuid": "4e27b5ad-e88c-4fdf-9d1f-1c50c2feaaa7",
                    "string": "IF TIME = <37.00, inf) AND RUN = <7.00, inf) THEN class = {73.59} [68.17, 79.00]",
                    "premise": {
                        "type": "compound",
                        "operator": "CONJUNCTION",
                        "subconditions": [
                            {
                                "left": 37.0,
                                "type": "elementary_numerical",
                                "right": null,
                                "negated": false,
                                "attributes": [
                                    6
                                ],
                                "left_closed": true,
                                "right_closed": false
                            },
                            {
                                "left": 7.0,
                                "type": "elementary_numerical",
                                "right": null,
                                "negated": false,
                                "attributes": [
                                    0
                                ],
                                "left_closed": true,
                                "right_closed": false
                            }
                        ]
                    },
                    "coverage": {
                        "N": 23,
                        "P": 5,
                        "n": 2,
                        "p": 4
                    },
                    "conclusion": {
                        "value": 73.58500000000001,
                        "train_covered_y_std": 5.416577691576998,
                        "train_covered_y_mean": 73.58500000000001,
                        'train_covered_y_min': 0.0,
                        'train_covered_y_max': 100.0,
                        "low": 68.168422308423,
                        "high": 79.00157769157701,
                        "fixed": false
                    }
                },
                {
                    "uuid": "83775a8d-6b55-4b85-b5fd-d0f5756fed02",
                    "string": "IF TIME = <24.77, inf) THEN class = {70.97} [49.24, 92.70]",
                    "premise": {
                        "type": "compound",
                        "operator": "CONJUNCTION",
                        "subconditions": [
                            {
                                "left": 24.775,
                                "type": "elementary_numerical",
                                "right": null,
                                "negated": false,
                                "attributes": [
                                    6
                                ],
                                "left_closed": true,
                                "right_closed": false
                            }
                        ]
                    },
                    "coverage": {
                        "N": 19,
                        "P": 9,
                        "n": 2,
                        "p": 9
                    },
                    "conclusion": {
                        "value": 70.97,
                        "train_covered_y_std": 21.72628841437177,
                        "train_covered_y_mean": 70.97,
                        'train_covered_y_min': 0.0,
                        'train_covered_y_max': 100.0,
                        "low": 49.24371158562823,
                        "high": 92.69628841437176,
                        "fixed": false
                    }
                },
                {
                    "uuid": "87801382-5ff7-491a-a1c8-30bcb0eae1d8",
                    "string": "IF TIME = <7.04, inf) AND RUN = (-inf, 38.50) AND SPEED1 = (-inf, 3.00) THEN class = {17.79} [11.68, 23.89]",
                    "premise": {
                        "type": "compound",
                        "operator": "CONJUNCTION",
                        "subconditions": [
                            {
                                "left": 7.045,
                                "type": "elementary_numerical",
                                "right": null,
                                "negated": false,
                                "attributes": [
                                    6
                                ],
                                "left_closed": true,
                                "right_closed": false
                            },
                            {
                                "left": null,
                                "type": "elementary_numerical",
                                "right": 38.5,
                                "negated": false,
                                "attributes": [
                                    0
                                ],
                                "left_closed": false,
                                "right_closed": false
                            },
                            {
                                "left": null,
                                "type": "elementary_numerical",
                                "right": 3.0,
                                "negated": false,
                                "attributes": [
                                    1
                                ],
                                "left_closed": false,
                                "right_closed": false
                            }
                        ]
                    },
                    "coverage": {
                        "N": 19,
                        "P": 9,
                        "n": 2,
                        "p": 8
                    },
                    "conclusion": {
                        "value": 17.785,
                        "train_covered_y_std": 6.107845446636643,
                        "train_covered_y_mean": 17.785,
                        'train_covered_y_min': 0.0,
                        'train_covered_y_max': 100.0,
                        "low": 11.677154553363357,
                        "high": 23.892845446636642,
                        "fixed": false
                    }
                },
                {
                    "uuid": "73d92148-0589-47fc-9203-5b5c4ac2dd43",
                    "string": "IF SPEED2 = (-inf, 2.25) AND SENS = (-inf, 9.00) AND SPEED1 = (-inf, 5.00) AND RUN = (-inf, 29.00) THEN class = {10.31} [8.70, 11.92]",
                    "premise": {
                        "type": "compound",
                        "operator": "CONJUNCTION",
                        "subconditions": [
                            {
                                "left": null,
                                "type": "elementary_numerical",
                                "right": 2.25,
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
                                "right": 9.0,
                                "negated": false,
                                "attributes": [
                                    5
                                ],
                                "left_closed": false,
                                "right_closed": false
                            },
                            {
                                "left": null,
                                "type": "elementary_numerical",
                                "right": 5.0,
                                "negated": false,
                                "attributes": [
                                    1
                                ],
                                "left_closed": false,
                                "right_closed": false
                            },
                            {
                                "left": null,
                                "type": "elementary_numerical",
                                "right": 29.0,
                                "negated": false,
                                "attributes": [
                                    0
                                ],
                                "left_closed": false,
                                "right_closed": false
                            }
                        ]
                    },
                    "coverage": {
                        "N": 24,
                        "P": 4,
                        "n": 2,
                        "p": 4
                    },
                    "conclusion": {
                        "value": 10.309999999999999,
                        "train_covered_y_std": 1.6083160620834327,
                        "train_covered_y_mean": 10.309999999999999,
                        'train_covered_y_min': 0.0,
                        'train_covered_y_max': 100.0,
                        "low": 8.701683937916567,
                        "high": 11.91831606208343,
                        "fixed": false
                    }
                }
            ]
        },
        "rule_coverage": {
            "4e27b5ad-e88c-4fdf-9d1f-1c50c2feaaa7": {
                "p": 4,
                "n": 2,
                "P": 5,
                "N": 23,
                "train_covered_y_std": 5.416577691576998,
                "train_covered_y_mean": 73.58500000000001
            },
            "83775a8d-6b55-4b85-b5fd-d0f5756fed02": {
                "p": 9,
                "n": 2,
                "P": 9,
                "N": 19,
                "train_covered_y_std": 21.726288414371748,
                "train_covered_y_mean": 70.97
            },
            "87801382-5ff7-491a-a1c8-30bcb0eae1d8": {
                "p": 8,
                "n": 2,
                "P": 9,
                "N": 19,
                "train_covered_y_std": 6.107845446636658,
                "train_covered_y_mean": 17.785
            },
            "73d92148-0589-47fc-9203-5b5c4ac2dd43": {
                "p": 4,
                "n": 2,
                "P": 4,
                "N": 24,
                "train_covered_y_std": 1.6083160620834327,
                "train_covered_y_mean": 10.309999999999999
            }
        }
    }
