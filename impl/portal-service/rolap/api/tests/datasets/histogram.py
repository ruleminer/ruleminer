import numpy as np
from django.urls import reverse
from rest_framework import status
from rolap.api.exceptions import NumericAttributeNotFoundException
from rolap.api.tests.datasets.rulesets import BaseSetup


class DatasetHistogramTestCase(BaseSetup):
    def test_get_histogram_for_all_attributes(self):
        bins: int = 5
        url = reverse(
            "dataset_histogram", kwargs={
                "dataset_id": self.dataset.pk}
        )
        url = f"{url}?bins={bins}"
        counts, division = np.histogram(self.df["sepallength"], bins=bins)
        expected_histogram = {
            "attribute_name": "sepallength",
            "counts": counts.tolist(),
            "division": division.tolist(),
        }
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        histogram = dict(next(
            h for h in response.data if h["attribute_name"] == "sepallength"
        ))
        self.assertEqual(len(
            response.data),
            self.df.shape[1] - 1,
            msg='Should calculate histogram for all numeric attributes of the dataset'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(histogram, expected_histogram)
        self.assertEqual(
            len(histogram['counts']), bins,
            'Histogram should have expected number of bins'
        )

    def test_get_histogram_for_selected_attributes(self):
        bins: int = 5
        selected_attributes: list[str] = ["sepallength", "sepalwidth"]
        url = reverse(
            "dataset_histogram", kwargs={
                "dataset_id": self.dataset.pk
            }
        )
        url = f"{url}?bins={bins}"
        url = f"{url}&attributes={','.join(selected_attributes)}"
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set([histogram['attribute_name'] for histogram in response.data]),
            set(selected_attributes),
            msg='Should calculate histogram only for selected attributes'
        )

        for attr in selected_attributes:
            counts, division = np.histogram(
                self.df[attr], bins=bins
            )
            expected_histogram = {
                "attribute_name": attr,
                "counts": counts.tolist(),
                "division": division.tolist(),
            }
            histogram = dict(
                next(h for h in response.data if h["attribute_name"] == attr)
            )
            self.assertEqual(histogram, expected_histogram)

    def test_get_histogram_for_nonexisting_attributes(self):
        bins: int = 5
        selected_attributes: list[str] = ["sepallength", "not_exist"]
        url = reverse("dataset_histogram", kwargs={
                      "dataset_id": self.dataset.pk
                      })
        url = f"{url}?bins={bins}"
        url = f"{url}&attributes={','.join(selected_attributes)}"
        self.client.force_authenticate(self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            response.data['err_msg_id'],
            NumericAttributeNotFoundException(selected_attributes).err_msg_id,
            msg=f'Should raise {NumericAttributeNotFoundException.__class__.__name__} for nonexisting attributes names.'
        )
