import io
import json

import pandas as pd
from django.conf import settings
from django.test import TransactionTestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models import Algorithm
from rolap.api.models import Dataset
from rolap.api.models import ImportanceResults
from rolap.api.models import PredictionResults
from rolap.api.models import Project
from rolap.api.models import Rules
from rolap.api.models import Ruleset
from rolap.api.models import Task
from rolap.api.models import TaskType
from rolap.api.models.algorithms import VotingMeasures


class RulesetAbstractTestCase(TransactionTestCase):

    def _make_body(self, df: pd.DataFrame) -> io.BytesIO:
        file = io.BytesIO()
        df.to_csv(file, index=False)
        file.seek(0)
        return file

    def setUp(self) -> None:
        self.client = APIClient()
        self._base_setup()
        self._ruleset_setup()

    def _base_setup(self):
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project: Project = Project.objects.create(
            name='Test Project',
            description='This is a test project.',
            type_of_problem='classification',
            owner=self.user
        )

        # HERE WE SHOULD CALL UPLOAD
        self.body_data = {
            "name": "test",
            "description": "Test dataset",
            "delimiter": ",",
            "decimal_separator": ".",
            "selected_columns": [0, 1, 2],
            "assigned_column_types": ["cat", "num", "cat"],
            "assigned_column_classes": ["attr", "attr", "class"],
            "missing_value_sign": "nan",
            "encoding": "utf-8"
        }

        self.test_df = pd.DataFrame(
            {
                "name": ["A", "B", "C"],
                "age": [1, 2, 3],
                "target": [1, 2, 3]
            }
        )

        url = reverse("upload_dataset", kwargs={
                      "project_id": self.project.pk})
        self.client.force_authenticate(self.user)
        file = self._make_body(self.test_df)
        response = self.client.put(
            url,
            data={"data": json.dumps(self.body_data), "file": file},
            format="multipart"
        )
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("dataset_id", content)

        self.dataset_id = content["dataset_id"]

    def _ruleset_setup(self):
        self.algorithm: Algorithm = Algorithm.objects.create(
            name="Rulekit",
            description_pl="Rulekit algorithm",
            description_en="Rulekit algorithm",
            problem_type="classification",
            version="1.0.0"
        )

        # ruleset first
        self.task = Task.objects.create(
            project=self.project,
            status=Task.TaskStatus.SUCCESS,
            type=TaskType.LEARNING,
            meta={},
        )
        self.task.source_object = Dataset.objects.get(pk=self.dataset_id)
        self.voting_measure = VotingMeasures.objects.create(
            value="Precision",
            description_pl="Opis po polsku",
            description_en="Description in English",
        )
        self.ruleset: Ruleset = Ruleset.objects.create(
            create_timestamp="2023-07-24T11:12:01.660Z",
            name="zbior-reg-6",
            description="some description",
            generation_params={
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
                    "pruning_measure": "Precision",
                    "induction_measure": "Precision",
                    "min_rule_coverage": 1
                }
            },
            voting_measure="Precision",
            ruleset={
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
            rules_count=10,
            avg_conditions_count=1.0,
            avg_precision=1.0,
            avg_coverage=1.0,
            fraction_significant=0.93,
            fraction_FDR_significant=0.93,
            total_conditions_count=24,
            algorithm_id=self.algorithm.id,
            attached_to_dataset_id=self.dataset_id,
            generated_from_dataset_id=self.dataset_id
        )
        self.task.result_object = self.ruleset
        self.task.save()
        self.importance_result: ImportanceResults = ImportanceResults.objects.create(
            created_at="2023-07-24T11:12:01.680Z",
            condition_importance={
                "Klasa1": {
                    "packed_cell_volume = (-inf, 56.50)": 0.5,
                    "total_protein = <5.60, inf)": 0.2
                },
                "Klasa2": {
                    "surgery = {no}": 0.1
                }
            },
            attribute_importance={
                "Klasa1": {
                    "Age": 0.5,
                    "Sex": 0.2
                },
                "Klasa2": {
                    "Income": 0.1
                }
            },
            ruleset_id=self.ruleset.id
        )

        self.prediction_result: PredictionResults = PredictionResults.objects.create(
            created_at="2023-07-24T11:12:01.684Z",
            results={
                "type_of_problem": "classification",
                "general": {
                    "F1_macro": 1.0,
                    "F1_micro": 1.0,
                    "F1_weighted": 1.0,
                    "Specificity": 1.0,
                    "G_mean_macro": 1.0,
                    "G_mean_micro": 1.0,
                    "Recall_macro": 1.0,
                    "Recall_micro": 1.0,
                    "G_mean_weighted": 1.0,
                    "Recall_weighted": 1.0,
                    "Confusion_matrix": {
                        "1": [1, 0, 0],
                        "2": [0, 1, 0],
                        "3": [0, 0, 1],
                        "classes": ["1", "2", "3"]
                    },
                    "Balanced_accuracy": 1.0
                },
                "for_classes": {
                    "1": {
                        "FN": 0,
                        "FP": 0,
                        "TN": 2,
                        "TP": 1,
                        "MCC": 1.0,
                        "NPV": 1.0,
                        "PPV": 1.0,
                        "G_mean": 1.0,
                        "Recall": 1.0,
                        "LR_plus": 0,
                        "F1_score": 1.0,
                        "LR_minus": 0.0,
                        "Odd_ratio": 0,
                        "Specificity": 1.0,
                        "Relative_risk": 0,
                        "Confusion_matrix": {
                            "1": [1, 0],
                            "other": [0, 2],
                            "classes": ["1", "other"]
                        }
                    },
                    "2": {
                        "FN": 0,
                        "FP": 0,
                        "TN": 2,
                        "TP": 1,
                        "MCC": 1.0,
                        "NPV": 1.0,
                        "PPV": 1.0,
                        "G_mean": 1.0,
                        "Recall": 1.0,
                        "LR_plus": 0,
                        "F1_score": 1.0,
                        "LR_minus": 0.0,
                        "Odd_ratio": 0,
                        "Specificity": 1.0,
                        "Relative_risk": 0,
                        "Confusion_matrix": {
                            "2": [1, 0],
                            "other": [0, 2],
                            "classes": ["2", "other"]
                        }
                    },
                    "3": {
                        "FN": 0,
                        "FP": 0,
                        "TN": 2,
                        "TP": 1,
                        "MCC": 1.0,
                        "NPV": 1.0,
                        "PPV": 1.0,
                        "G_mean": 1.0,
                        "Recall": 1.0,
                        "LR_plus": 0,
                        "F1_score": 1.0,
                        "LR_minus": 0.0,
                        "Odd_ratio": 0,
                        "Specificity": 1.0,
                        "Relative_risk": 0,
                        "Confusion_matrix": {
                            "3": [1, 0],
                            "other": [0, 2],
                            "classes": ["3", "other"]
                        }
                    }
                }
            },
            dataset_id=self.dataset_id,
            ruleset_id=self.ruleset.id
        )

        self.rule1 = Rules.objects.create(
            uuid="f97e8b32-ca75-4553-b5ed-a183125f3cf1",
            p=1,
            n=0,
            P=1,
            N=2,
            indicators={
                "C2": 0.85,
                "RSS": 0.0003,
                "lift": 1.35,
                "coverage": 0.97,
                "n_unique": 8.0,
                "p_unique": 13.0,
                "precision": 0.92,
                "correlation": 0.72,
                "p_val_adjusted": 0.032,
                "num_of_conditions": 10.0
            },
            created_at="2023-07-24T11:12:01.668Z",
            ruleset_id=self.ruleset.id
        )
        self.rule2 = Rules.objects.create(
            uuid="0ff7eb09-1ad0-4a6b-b9ad-173ff1c3e3dd",
            p=1,
            n=0,
            P=1,
            N=2,
            indicators={
                "C2": 0.85,
                "RSS": 0.0003,
                "lift": 1.35,
                "coverage": 0.97,
                "n_unique": 8.0,
                "p_unique": 13.0,
                "precision": 0.92,
                "correlation": 0.72,
                "p_val_adjusted": 0.032,
                "num_of_conditions": 10.0
            },
            created_at="2023-07-24T11:12:01.673Z",
            ruleset_id=self.ruleset.id
        )
        self.rule3 = Rules.objects.create(
            uuid="eedd0179-919a-42e5-ad66-804e098551f6",
            p=1,
            n=0,
            P=1,
            N=2,
            indicators={
                "C2": 0.85,
                "RSS": 0.0003,
                "lift": 1.35,
                "coverage": 0.97,
                "n_unique": 8.0,
                "p_unique": 13.0,
                "precision": 0.92,
                "correlation": 0.72,
                "p_val_adjusted": 0.032,
                "num_of_conditions": 10.0
            },
            created_at="2023-07-24T11:12:01.677Z",
            ruleset_id=self.ruleset.id
        )
