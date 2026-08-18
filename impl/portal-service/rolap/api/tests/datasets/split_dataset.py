from django.urls import reverse
from rest_framework import status
from rolap.api.tests.datasets.rulesets import BaseSetup
from rolap.api.models.datasets import Dataset


class DatasetSplitViewTests(BaseSetup):
    def setUp(self):
        super().setUp()
        self.request_data = {
            "split_ratio": 0.2,
            "training_set_name": "Train Dataset",
            "test_set_name": "Test Dataset",
            "split_mode": "random"
        }
        self.url = reverse('dataset_split', kwargs={
                           'dataset_id': self.dataset.pk})

    def test_split_dataset_for_all_modes_success(self):
        for mode in ['random', 'stratified', 'chronological']:
            with self.subTest(split_mode=mode):
                self.request_data['split_mode'] = mode
                self.request_data['training_set_name'] = f"train dataset {mode}"
                self.request_data['test_set_name'] = f"test dataset {mode}"
                self.client.force_authenticate(user=self.user)
                response = self.client.post(
                    self.url, data=self.request_data, format='json')
                self.assertEqual(
                    response.status_code, status.HTTP_200_OK, f"Failed for split mode: {mode}")

                response_data = response.json()
                self.assertIn('train_dataset_id', response_data)
                self.assertIn('test_dataset_id', response_data)

                training_dataset = Dataset.objects.get(
                    pk=response_data['train_dataset_id'])
                testing_dataset = Dataset.objects.get(
                    pk=response_data['test_dataset_id'])
                self.assertIsNotNone(training_dataset)
                self.assertIsNotNone(testing_dataset)

                original_count = self.df.shape[0]
                training_count, _ = training_dataset.read_dataset_from_storage()
                testing_count, _ = testing_dataset.read_dataset_from_storage()
                training_count = training_count.shape[0]
                testing_count = testing_count.shape[0]

                expected_train_ratio = 1 - self.request_data['split_ratio']
                expected_test_ratio = self.request_data['split_ratio']

                if expected_train_ratio is not None and expected_test_ratio is not None:
                    self.assertAlmostEqual(training_count / original_count, expected_train_ratio,
                                           places=1, msg=f"Training count does not match expected ratio for mode: {mode}")
                    self.assertAlmostEqual(testing_count / original_count, expected_test_ratio,
                                           places=1, msg=f"Testing count does not match expected ratio for mode: {mode}")

    def test_split_dataset_invalid_mode(self):
        self.request_data['split_mode'] = 'invalid_mode'
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.url, data=self.request_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_split_dataset_without_authentication(self):
        response = self.client.post(
            self.url, data=self.request_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
