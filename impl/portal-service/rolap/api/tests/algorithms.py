import json
import random

from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models import Algorithm
from rolap.api.models import AlgorithmParams
from rolap.api.models import ParamsChoiceValues
from rolap.api.serializers.algorithms import ManageAlgorithmSerializer


class AlgorithmsViewTestCase(TestCase):
    def setUp(self):
        self.client: APIClient = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.operator_user: User = User.objects.create_user(
            keycloak_id='2', username='testoperator', email='testoperator@test.com', password='testpass'
        )
        self.operator_user._permissions = [settings.KEYCLOAK_OPERATOR_ROLE]
        self.algorithms = []
        for i in range(1, 6):
            algorithm = Algorithm.objects.create(
                problem_type="classification",
                name=f"Algorithm{i}",
                version="1.0",
                description_pl="Opis po polsku",
                description_en="Description in English",
            )
            self.algorithms.append(algorithm)
            if i == 5:
                algorithm = Algorithm.objects.create(
                    problem_type="classification",
                    name=f"Algorithm{i}",
                    version="1.1",
                    description_pl="Opis po polsku",
                    description_en="Description in English",
                )
            self.algorithms.append(algorithm)

        self.params = []
        for _ in range(10):
            algorithm = random.choice(self.algorithms)
            param = AlgorithmParams.objects.create(
                algorithm=algorithm,
                name=f"Param{_}",
                parameter_type=random.choice(
                    [x[0] for x in AlgorithmParams.TYPE_OF_PARAMETER]),
                description_pl="Opis parametru po polsku",
                description_en="Parameter description in English",
                default_value="default",
                min_value="0",
                max_value="10",
            )
            self.params.append(param)

        self.choices = []
        for _ in range(20):
            param = random.choice(self.params)
            choice = ParamsChoiceValues.objects.create(
                algorithm_params=param,
                value=f"Value{_}",
                description_pl="Opis wartości po polsku",
                description_en="Value description in English",
            )
            self.choices.append(choice)

    def test_get_algorithms_no_problem_type(self):
        url = reverse("algorithms-for-problem")
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_algorithms_no_algorithms_available(self):
        url = reverse("algorithms-for-problem") + \
            "?problem=nonexistent_problem_type"
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_algorithms_with_latest_versions(self):
        url = reverse("algorithms-for-problem") + "?problem=classification"
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        algorithms_data = response.data
        self.assertEqual(len(algorithms_data), 5)
        algorithm5_found = False
        for algorithm_data in algorithms_data:
            if algorithm_data["name"] == "Algorithm5":
                algorithm5_found = True
                self.assertEqual(algorithm_data["version"], "1.1")
        self.assertTrue(algorithm5_found,
                        "Algorithm5 not found in algorithms_data.")

    def test_algorithm_serializer(self):
        data: dict = json.load(
            open(
                'test_data/jsons/algorithms/rulekit/classification.json',
                mode='r',
                encoding='utf-8'
            )
        )
        serializer = ManageAlgorithmSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()


class AlgorithmDetailViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.algorithm = Algorithm.objects.create(
            problem_type=Algorithm.CLASSIFICATION,
            name="Test Algorithm",
            version="1.0",
            description_pl="Opis po polsku",
            description_en="Description in English",
        )
        self.param = AlgorithmParams.objects.create(
            algorithm=self.algorithm,
            name="Test Param",
            parameter_type=AlgorithmParams.INTEGER,
            description_pl="Opis parametru po polsku",
            description_en="Parameter description in English",
            default_value="default",
            min_value="0",
            max_value="10",
        )
        self.choice_param = AlgorithmParams.objects.create(
            algorithm=self.algorithm,
            name="Test Choice Param",
            parameter_type=AlgorithmParams.CHOICE,
            description_pl="Opis parametru typu wyboru po polsku",
            description_en="Choice parameter description in English",
            default_value="Value1",
        )
        ParamsChoiceValues.objects.create(
            algorithm_params=self.choice_param,
            value="Value1",
            description_pl="Opis wartości po polsku",
            description_en="Value description in English",
        )
        ParamsChoiceValues.objects.create(
            algorithm_params=self.choice_param,
            value="Value2",
            description_pl="Opis wartości po polsku",
            description_en="Value description in English",
        )

    def test_get_algorithm_details(self):
        url = reverse("algorithm-detail", args=[self.algorithm.id])
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["name"], "Test Algorithm")
        self.assertEqual(len(data["parameters"]), 2)
        param_data1, param_data2 = data["parameters"]

        self.assertEqual(param_data1["name"], "Test Param")
        self.assertEqual(
            param_data1["parameter_type"], AlgorithmParams.INTEGER)
        self.assertEqual(param_data1["description_pl"],
                         "Opis parametru po polsku")
        self.assertEqual(param_data1["description_en"],
                         "Parameter description in English")
        self.assertEqual(param_data1["default_value"], "default")
        self.assertEqual(param_data1["min_value"], "0")
        self.assertEqual(param_data1["max_value"], "10")

        self.assertEqual(param_data2["name"], "Test Choice Param")
        self.assertEqual(param_data2["parameter_type"], AlgorithmParams.CHOICE)
        self.assertEqual(param_data2["description_pl"],
                         "Opis parametru typu wyboru po polsku")
        self.assertEqual(param_data2["description_en"],
                         "Choice parameter description in English")
        self.assertEqual(param_data2["default_value"], "Value1")
        self.assertNotIn("min", param_data2["parameter_values"])
        self.assertNotIn("max", param_data2["parameter_values"])
        self.assertEqual(len(param_data2["parameter_values"]), 2)

    def test_get_nonexistent_algorithm_details(self):
        url = reverse("algorithm-detail", args=[999])
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
