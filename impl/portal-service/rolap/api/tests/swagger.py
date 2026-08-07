from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


class SwaggerTestCase(TestCase):
    def test_swagger(self):
        """This test targets the schema, as that is where the problem tends to arise."""
        client = APIClient()
        url = reverse("openapi-schema")
        response = client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
