from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from keycloak_auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.utils.http import IndicatorHttpService


class DeterminationHistogramsViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            keycloak_id='1', username='testuser', email='testuser@test.com', password='testpass'
        )
        self.user._permissions = [settings.KEYCLOAK_USER_ROLE]
        self.project = Project.objects.create(
            name='Test Project', description='This is a test project.',
            type_of_problem='regression', owner=self.user,
        )
        self.dataset = Dataset.objects.create(
            name='Test dataset 1', project=self.project,
        )

        self.ruleset = {
            "meta": {
                "attributes": ["attr1", "attr2"],
                "decision_attribute": "decision",
                "decision_attribute_distribution": {"a": 1, "b": 2}
            },
            "rules": {
                "rule1": "expression1",
                "rule2": "expression2",
            }
        }

    def test_calculate_histograms_success(self):
        try:
            oryginal_calculate_histograms = IndicatorHttpService.calculate_histograms
            IndicatorHttpService.calculate_histograms = lambda self, request: {
                "max": 6,
                "min": 0,
                "bin_edges": [
                    7.32,
                    15.218,
                    23.116,
                    31.013999999999996,
                    38.91199999999999,
                    46.809999999999995,
                    54.70799999999999,
                    62.605999999999995,
                    70.50399999999999,
                    78.40199999999999,
                    86.3
                ],
                "histograms": {
                    "4e27b5ad-e88c-4fdf-9d1f-1c50c2feaaa7": [
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        4,
                        2
                    ],
                    "87801382-5ff7-491a-a1c8-30bcb0eae1d8": [
                        2,
                        6,
                        1,
                        1,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0
                    ]
                }
            }
            url = reverse("determination-rules-histograms",
                          args=[self.dataset.id])
            self.client.force_authenticate(self.user)

            payload = {
                "ruleset": self.ruleset,
                "bins": 10,
            }

            response = self.client.put(url, payload, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()

            self.assertIn("max", data)
            self.assertIn("min", data)
            self.assertIn("bin_edges", data)
            self.assertIn("histograms", data)
        finally:
            IndicatorHttpService.calculate_histograms = oryginal_calculate_histograms

    def test_calculate_histograms_invalid_dataset_id(self):
        url = reverse("determination-rules-histograms", args=[999])
        self.client.force_authenticate(self.user)

        payload = {
            "ruleset": self.ruleset,
            "bins": 10,
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_calculate_histograms_not_supported_problem_type(self):
        url = reverse("determination-rules-histograms", args=[self.dataset.id])
        self.client.force_authenticate(self.user)

        payload = {
            "ruleset": self.ruleset,
            "bins": 10,
        }
        self.project.type_of_problem = 'classification'
        self.project.save()

        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["detail"], "Histogram for classification is not supported yet")
