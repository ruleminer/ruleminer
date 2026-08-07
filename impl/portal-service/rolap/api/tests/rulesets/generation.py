from django.conf import settings
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.models.algorithms import Algorithm
from rolap.api.models.algorithms import NAAlgorithmParameters
from rolap.api.models.algorithms import Question
from rolap.api.serializers.rulesets.algorithms import QuestionSerializer


class QuestionListViewTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.algorithm = Algorithm.objects.create(
            problem_type=Algorithm.CLASSIFICATION,
            name="Test Algorithm",
            version="1.0",
            description_pl="Opis po polsku",
            description_en="Description in English",
        )
        self.question1 = Question.objects.create(algorithm=self.algorithm, question_number=1,
                                                 question_text_pl="Pytanie 1", question_text_en="Question 1")
        self.question2 = Question.objects.create(algorithm=self.algorithm, question_number=2,
                                                 question_text_pl="Pytanie 2", question_text_en="Question 2")
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]

    def test_get_questions_by_algorithm(self):
        url = reverse("questions-for-algorithm",
                      kwargs={"algorithm_id": self.algorithm.id})
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        questions = Question.objects.filter(algorithm=self.algorithm)
        serializer = QuestionSerializer(questions, many=True)
        self.assertEqual(response.data, serializer.data)

    def test_get_questions_list_nonexistent_algorithm(self):
        url = reverse("questions-for-algorithm",
                      kwargs={"algorithm_id": self.algorithm.id + 100})
        self.client.force_authenticate(self.user)
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_questions_list_unauthorized(self):
        url = reverse("questions-for-algorithm",
                      kwargs={"algorithm_id": self.algorithm.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class NAAlgorithmParametersViewTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
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
        self.answer_string = "1.1_2.3"
        self.min_part_of_smallest_cls = 0.5
        self.prct_of_noise = 11
        self.params = NAAlgorithmParameters.objects.create(
            algorithm=self.algorithm, answer_string=self.answer_string, params_json={
                "param1": "value1", "param2": "value2", "max_uncovered_fraction": {"min_part_of_smallest_cls": self.min_part_of_smallest_cls}}
        )
        self.project: Project = Project.objects.create(
            name='Test Project', description='This is a test project.',
            type_of_problem=Project.CLASSIFICATION, owner=self.user,
        )
        self.cls_distribution = {
            "X": 80,
            "Y": 20
        }
        self.dataset: Dataset = Dataset.objects.create(
            name='Test dataset 1', project=self.project, class_distribution=self.cls_distribution)

    def test_get_algorithm_parameters(self):
        url = reverse("params-for-non-advanced",
                      kwargs={"algorithm_id": self.algorithm.id, "dataset_id": self.dataset.id})
        self.client.force_authenticate(self.user)
        response = self.client.post(url, data={
            "answers": {"1": "1", "2": "3"},
            "extra_values": {"prct_of_noise": self.prct_of_noise}
        }, format='json')

        expected_max_uncovered_fraction = min(
            (self.cls_distribution['Y']*self.min_part_of_smallest_cls / 100), self.prct_of_noise)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("max_uncovered_fraction", response.data)
        self.assertEqual(
            response.data["max_uncovered_fraction"], expected_max_uncovered_fraction)

    def test_get_algorithm_parameters_not_found(self):
        url = reverse("params-for-non-advanced",
                      kwargs={"algorithm_id": self.algorithm.id, "dataset_id": self.dataset.id})
        self.client.force_authenticate(self.user)
        response = self.client.post(
            url, data={"answers": {"1": "3", "2": "4"}}, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn(
            "Algorithm parameters for these answers do not exist", response.data["detail"])

    def test_get_algorithm_parameters_unauthorized(self):
        url = reverse("params-for-non-advanced",
                      kwargs={"algorithm_id": self.algorithm.id, "dataset_id": self.dataset.id})
        response = self.client.post(
            url, data={"answers": {"1": "1", "2": "3"}}, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
