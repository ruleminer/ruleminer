from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models import Algorithm
from rolap.api.models import CrossValidationResult
from rolap.api.models import Ruleset
from rolap.api.models.datasets import Dataset
from rolap.api.models.projects import Project


class CVResultViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user: User = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project: Project = Project.objects.create(
            name='Test Project', description='This is a test project.',
            type_of_problem='classification', owner=self.user,
        )
        self.dataset: Dataset = Dataset.objects.create(
            name='Test dataset 1', project=self.project)
        self.algorithm: Algorithm = Algorithm.objects.create(
            problem_type=Algorithm.CLASSIFICATION,
            name="Test algo",
            version="v1",
            description_pl="pl",
            description_en="en",
        )
        self.ruleset: Ruleset = Ruleset.objects.create(
            name="Ruleset for test dataset 1",
            attached_to_dataset=self.dataset,
            generated_from_dataset=self.dataset,
            algorithm=self.algorithm,
        )
        result = {
            "avg": {
                "Number of rules": 1.0,
                "Number of conditions in a rule": 2.0,
                "Rule precision": 3.0,
                "Rule coverage": 4.0,
                "Balanced accuracy - train": 5.0,
                "Balanced accuracy - test": 6.0,
                "F1-score micro train": 7.0,
                "F1-score micro test": 8.0,
                "Recall micro train": 9.0,
                "Recall micro test": 10.0
            },
            "std": {
                "Number of rules": 0.0,
                "Number of conditions in a rule": 0.0,
                "Rule precision": 0.0,
                "Rule coverage": 0.0,
                "Balanced accuracy - train": 0.0,
                "Balanced accuracy - test": 0.0,
                "F1-score micro train": 0.0,
                "F1-score micro test": 0.0,
                "Recall micro train": 0.0,
                "Recall micro test": 0.0
            },
            "min": {
                "Number of rules": 1.0,
                "Number of conditions in a rule": 2.0,
                "Rule precision": 3.0,
                "Rule coverage": 4.0,
                "Balanced accuracy - train": 5.0,
                "Balanced accuracy - test": 6.0,
                "F1-score micro train": 7.0,
                "F1-score micro test": 8.0,
                "Recall micro train": 9.0,
                "Recall micro test": 10.0
            },
            "25%": {
                "Number of rules": 1.0,
                "Number of conditions in a rule": 2.0,
                "Rule precision": 3.0,
                "Rule coverage": 4.0,
                "Balanced accuracy - train": 5.0,
                "Balanced accuracy - test": 6.0,
                "F1-score micro train": 7.0,
                "F1-score micro test": 8.0,
                "Recall micro train": 9.0,
                "Recall micro test": 10.0
            },
            "50%": {
                "Number of rules": 1.0,
                "Number of conditions in a rule": 2.0,
                "Rule precision": 3.0,
                "Rule coverage": 4.0,
                "Balanced accuracy - train": 5.0,
                "Balanced accuracy - test": 6.0,
                "F1-score micro train": 7.0,
                "F1-score micro test": 8.0,
                "Recall micro train": 9.0,
                "Recall micro test": 10.0
            },
            "75%": {
                "Number of rules": 1.0,
                "Number of conditions in a rule": 2.0,
                "Rule precision": 3.0,
                "Rule coverage": 4.0,
                "Balanced accuracy - train": 5.0,
                "Balanced accuracy - test": 6.0,
                "F1-score micro train": 7.0,
                "F1-score micro test": 8.0,
                "Recall micro train": 9.0,
                "Recall micro test": 10.0
            },
            "max": {
                "Number of rules": 1.0,
                "Number of conditions in a rule": 2.0,
                "Rule precision": 3.0,
                "Rule coverage": 4.0,
                "Balanced accuracy - train": 5.0,
                "Balanced accuracy - test": 6.0,
                "F1-score micro train": 7.0,
                "F1-score micro test": 8.0,
                "Recall micro train": 9.0,
                "Recall micro test": 10.0
            }
        }
        self.cv_result = CrossValidationResult.objects.create(
            ruleset=self.ruleset,
            num_folds=5,
            result=result,
        )

    def test_cv_view(self):
        url = reverse("crossvalidation", args=[
                      self.dataset.pk, self.ruleset.pk])
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
