from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase


class RulesetCommitTestCase(RulesetAbstractTestCase):
    def setUp(self):
        self.client = APIClient()
        self._base_setup()
        self.body = {
            "algorithm_id": 1,
            "name": "zbior-reg-6",
            "description": "some description",
            "generation_params": {
                "attributes": [
                    {
                        "role": "attr",
                        "name": "name"
                    },
                    {
                        "role": "attr",
                        "name": "age"
                    },
                    {
                        "role": "class",
                        "name": "target"
                    }
                ],
                "algorithm_params": {
                    "name": "zbior-reg-22",
                    "num_folds": 3,
                    "attributes": [
                        {
                            "role": "attr",
                            "name": "name"
                        },
                        {
                            "role": "attr",
                            "name": "age"
                        },
                        {
                            "role": "class",
                            "name": "target"
                        }
                    ],
                    "dataset_id": 15,
                    "description": "some description",
                    "algorithm_id": 1,
                    "algorithm_params": {
                        "voting_measure": "Precision",
                        "pruning_measure": "Precision",
                        "induction_measure": "Precision",
                        "min_rule_coverage": 1
                    },
                    "cross_validation": False,
                    "generation_method": "Rulekit",
                }
            },
            "ruleset": {
                "meta": {
                    "attributes": [
                        "name",
                        "age"
                    ],
                    "decision_attribute": "target",
                    "decision_attribute_distribution": {
                        "1": 1,
                        "2": 1,
                        "3": 1
                    }
                },
                "rules": [
                    {
                        "uuid": "f97e8b32-ca75-4553-b5ed-a183125f3cf1",
                        "string": "IF name = {A} THEN target = 1 ",
                        "premise": {
                            "type": "compound",
                            "operator": "CONJUNCTION",
                            "subconditions": [
                                {
                                    "type": "elementary_nominal",
                                    "value": "A",
                                    "negated": False,
                                    "attributes": [
                                        0
                                    ]
                                }
                            ]
                        },
                        "coverage": {
                            "n": 0,
                            "p": 1
                        },
                        "conclusion": {
                            "value": "1"
                        }
                    },
                    {
                        "uuid": "0ff7eb09-1ad0-4a6b-b9ad-173ff1c3e3dd",
                        "string": "IF name = {B} THEN target = 2 ",
                        "premise": {
                            "type": "compound",
                            "operator": "CONJUNCTION",
                            "subconditions": [
                                {
                                    "type": "elementary_nominal",
                                    "value": "B",
                                    "negated": False,
                                    "attributes": [
                                        0
                                    ]
                                }
                            ]
                        },
                        "coverage": {
                            "n": 0,
                            "p": 1
                        },
                        "conclusion": {
                            "value": "2"
                        }
                    },
                    {
                        "uuid": "eedd0179-919a-42e5-ad66-804e098551f6",
                        "string": "IF name = {C} THEN target = 3 ",
                        "premise": {
                            "type": "compound",
                            "operator": "CONJUNCTION",
                            "subconditions": [
                                {
                                    "type": "elementary_nominal",
                                    "value": "C",
                                    "negated": False,
                                    "attributes": [
                                        0
                                    ]
                                }
                            ]
                        },
                        "coverage": {
                            "n": 0,
                            "p": 1
                        },
                        "conclusion": {
                            "value": "3"
                        }
                    }
                ]
            },
            "attached_to_dataset_id": self.dataset_id,
            "generated_from_dataset_id": self.dataset_id,
            "cross_validation": False,
            "num_folds": 0,
        }

    def test_commit_ruleset(self):
        # url = reverse(
        #     "ruleset-generation-result"
        # )
        # self.client.force_authenticate(self.user)
        # response = self.client.post(url, data=self.body, format="json")
        # self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # not possible - we need to run rules-evaluation-service in test mode
        # with access to the storage
        pass

    def test_commit_ruleset_different_dataset(self):
        # not possible - we need to run rules-evaluation-service in test mode
        # with access to the storage
        pass

    def test_commit_ruleset_unauthorized(self):
        url = reverse(
            "ruleset-generation-result"
        )
        response = self.client.post(url, data=self.body, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
