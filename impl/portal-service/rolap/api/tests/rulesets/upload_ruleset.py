import json

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rolap.api.models.algorithms import VotingMeasures
from rolap.api.models.algorithms import RuleSetImportAlgorithm
from rolap.api.models.datasets import Dataset
from rolap.api.models.datasets import DatasetAttributes
from rolap.api.models.projects import Project
from rolap.api.serializers.algorithms import ManageVotingMeasuresSerializer
from rolap.api.serializers.algorithms import RuleSetImportAlgorithmSerializer


class VotingMeasuresListViewTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        VotingMeasures.objects.create(
            value="Accuracy", description_pl="Dokładność - opis PL", description_en="Accuracy - description EN")
        VotingMeasures.objects.create(
            value="Precision", description_pl="Precyzja - opis PL", description_en="Precision - description EN")

    def test_get_voting_measures_unauthenticated(self):
        """
        Test to verify that unauthenticated requests are not allowed.
        """
        url = reverse('voting-measures')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_voting_measures_authenticated(self):
        """
        Test to verify that authenticated requests return voting measures.
        """
        self.client.force_authenticate(user=self.user)
        url = reverse('voting-measures')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        measures = VotingMeasures.objects.all()
        serializer = ManageVotingMeasuresSerializer(measures, many=True)
        self.assertEqual(response.data, serializer.data)


class RuleSetImportAlgorithmListViewTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.algorithm1 = RuleSetImportAlgorithm.objects.create(
            name="Algorithm1", description_pl="Testowy Algorytm 1", description_en="Test Algorithm 1", implementation_url="http://example.com/algorithm1",
            supported_problem_types=[Project.CLASSIFICATION]
        )
        self.algorithm2 = RuleSetImportAlgorithm.objects.create(
            name="Algorithm2", description_pl="Testowy Algorytm 2", description_en="Test Algorithm 2", implementation_url="http://example.com/algorithm2",
            supported_problem_types=[Project.REGRESSION]
        )
        self.algorithm3 = RuleSetImportAlgorithm.objects.create(
            name="Algorithm3", description_pl="Testowy Algorytm 3", description_en="Test Algorithm 3", implementation_url="http://example.com/algorithm3",
            supported_problem_types=[Project.SURVIVAL, Project.CLASSIFICATION]
        )
        self.project_classification = Project.objects.create(
            name="Classification Project", type_of_problem=Project.CLASSIFICATION, owner=self.user
        )
        self.project_regression = Project.objects.create(
            name="Regression Project", type_of_problem=Project.REGRESSION, owner=self.user
        )
        self.project_survival = Project.objects.create(
            name="Survival Project", type_of_problem=Project.SURVIVAL, owner=self.user
        )

    def test_get_ruleset_import_algorithms_classification(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('import-ruleset-algorithms',
                      kwargs={'project_id': self.project_classification.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_algorithms = [self.algorithm1, self.algorithm3]
        self.assertEqual(len(response.data), len(expected_algorithms))
        serializer = RuleSetImportAlgorithmSerializer(
            expected_algorithms, many=True)
        self.assertEqual(response.data, serializer.data)

    def test_get_ruleset_import_algorithms_regression(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('import-ruleset-algorithms',
                      kwargs={'project_id': self.project_regression.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_algorithms = [self.algorithm2]
        self.assertEqual(len(response.data), len(expected_algorithms))
        serializer = RuleSetImportAlgorithmSerializer(
            expected_algorithms, many=True)
        self.assertEqual(response.data, serializer.data)

    def test_get_ruleset_import_algorithms_survival(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('import-ruleset-algorithms',
                      kwargs={'project_id': self.project_survival.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_algorithms = [self.algorithm3]
        self.assertEqual(len(response.data), len(expected_algorithms))
        serializer = RuleSetImportAlgorithmSerializer(
            expected_algorithms, many=True)
        self.assertEqual(response.data, serializer.data)

    def test_get_ruleset_import_algorithms_no_algorithms_found(self):
        self.client.force_authenticate(user=self.user)
        new_project = Project.objects.create(
            name="Unmatched Project", type_of_problem="UNKNOWN", owner=self.user
        )
        url = reverse('import-ruleset-algorithms',
                      kwargs={'project_id': new_project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class UploadRulesetViewTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        RuleSetImportAlgorithm.objects.create(
            name="TEXT",
            implementation_url="",
            description_pl="Import reguł z pliku tekstowego ...",
            description_en="Import rules from a text file ...",
            supported_problem_types=[
                "classification", "regression", "survival"]
        )

        RuleSetImportAlgorithm.objects.create(
            name="JSON",
            implementation_url="",
            description_pl="Import reguł w formacie JSON ...",
            description_en="Import rules in JSON format ...",
            supported_problem_types=[
                "classification", "regression", "survival"]
        )
        self.project = Project.objects.create(
            name="Test Project", type_of_problem=Project.CLASSIFICATION, owner=self.user)
        self.dataset = Dataset.objects.create(
            name="Test Dataset", project=self.project)
        self.attribute1 = DatasetAttributes.objects.create(
            name="preg", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL,
            role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE,
        )
        self.attribute2 = DatasetAttributes.objects.create(
            name="plas", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL,
            role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE,
        )
        self.attribute3 = DatasetAttributes.objects.create(
            name="pres", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.NUMERICAL,
            role=DatasetAttributes.DataAttributeRoles.ATTRIBUTE,
        )
        self.attribute4 = DatasetAttributes.objects.create(
            name="class", dataset=self.dataset, missing_values_count=0,
            type=DatasetAttributes.DataAttributeTypes.CATEGORICAL,
            role=DatasetAttributes.DataAttributeRoles.CLASSIFICATION,
        )
        self.data: dict = {
            "name": "Test Ruleset json",
            "description": "A test ruleset.",
            "prediction_config": {
                "prediction_strategy": "vote",
                "use_default_rule": True,
                "voting_measure": "Correlation",
            }
        }
        null = None
        false = False
        true = True
        self.ruleset_data = {
            "meta": {
                "attributes": [
                    "preg",
                    "plas",
                    "pres"
                ],
                "decision_attribute": "class",
                "decision_attribute_distribution": {
                    "tested_negative": 500,
                    "tested_positive": 268
                }
            },
            "rules": [
                {
                    "uuid": "7be3317a-841d-4e2c-be00-64029b5adfa6",
                    "string": "IF preg >= 13.50 THEN class = tested_positive",
                    "premise": {
                        "type": "compound",
                        "operator": "CONJUNCTION",
                        "subconditions": [
                            {
                                "left": 13.5,
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
                        "N": 500,
                        "P": 268,
                        "n": 0,
                        "p": 4
                    },
                    "conclusion": {
                        "value": "tested_positive"
                    }
                }]}
        VotingMeasures.objects.create(
            value="Correlation",
            description_en="Correlation measure",
            description_pl="Miara korelacji",
        )
        self.client.force_authenticate(user=self.user)

    def test_upload_ruleset_json_valid(self):
        url = reverse("upload-ruleset", kwargs={"dataset_id": self.dataset.pk})
        data = {'data': json.dumps(self.data)}
        json_file = SimpleUploadedFile("ruleset.json", json.dumps(
            self.ruleset_data).encode('utf-8'), content_type="application/json")
        response = self.client.post(
            url, {'data': data['data'], 'file': json_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("task_id", response.data)
        self.assertIsInstance(response.data["task_id"], int)

    def test_upload_ruleset_txt_invalid(self):
        url = reverse("upload-ruleset", kwargs={"dataset_id": self.dataset.pk})
        payload = self.data.copy()
        payload["external_algorithm_name"] = 'TEXT'

        data = {"data": json.dumps(payload)}
        txt_file = SimpleUploadedFile(
            "ruleset.txt", b"rule1\nrule2", content_type="text/plain")
        response = self.client.post(
            url, {'data': data['data'], 'file': txt_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("err_msg_id", response.data)
        self.assertEqual(response.data["err_msg_id"],
                         "missing_if_keyword_error")

    def test_upload_ruleset_txt_valid(self):
        url = reverse("upload-ruleset", kwargs={"dataset_id": self.dataset.pk})
        payload = self.data.copy()
        payload["external_algorithm_name"] = "TEXT"

        data = {"data": json.dumps(payload)}
        txt_file = SimpleUploadedFile(
            "ruleset.txt", b"IF preg >= 13.50 THEN class = {tested_positive}\nIF plas < 13.50 THEN class = {tested_negative}", content_type="text/plain")
        response = self.client.post(
            url, {'data': data['data'], 'file': txt_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("task_id", response.data)
        self.assertIsInstance(response.data["task_id"], int)

    def test_upload_incorrect_ruleset_json(self):
        url = reverse("upload-ruleset", kwargs={"dataset_id": self.dataset.pk})
        data = {'data': json.dumps(self.data)}
        json_file = SimpleUploadedFile("ruleset.json", json.dumps(
            {"rules": []}).encode('utf-8'), content_type="application/json")
        response = self.client.post(
            url, {'data': data['data'], 'file': json_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_ruleset_invalid_target_attribute(self):
        url = reverse("upload-ruleset", kwargs={"dataset_id": self.dataset.pk})
        data = {'data': json.dumps(self.data)}
        self.ruleset_data["meta"]["decision_attribute"] = "invalid"
        json_file = SimpleUploadedFile("ruleset.json", json.dumps(
            self.ruleset_data).encode('utf-8'), content_type="application/json")
        response = self.client.post(
            url, {'data': data['data'], 'file': json_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["err_msg_id"],
                         "target_attribute_mismatch_error")

    def test_upload_ruleset_no_file(self):
        url = reverse("upload-ruleset", kwargs={"dataset_id": self.dataset.pk})
        data = {'data': json.dumps(self.data)}
        response = self.client.post(
            url, {'data': data['data']}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
