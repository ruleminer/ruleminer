import os
import pathlib
import shutil
import unittest

import pandas as pd
from emag_reports.generate import generate_report
from emag_reports.models import DatasetSettings
from tests.settings import DATASET_MAPPING
from tests.settings import REPORT_MAPPING


"""
Integration tests for report generation.

We use:
    for each problem type (classification, regression, survival),
    three sample datasets,
    to test two kinds of reports,
which gives us 18 tests in total.

This does not eliminate any errors in the future, since for now these tests only use default settings.
However, these tests can be useful for any changes or new features.
"""

QUARTO_SETTINGS = """
project:
  type: default

execute:
  echo: false
  freeze: false

format:
  html:
    html-table-processing: none
    embed-resources: true
    anchor-sections: false
    grid:
      body-width: 1000px
      margin-width: 100px
"""


class BaseReportGenerationTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open("_quarto.yaml", "w") as f:
            f.write(QUARTO_SETTINGS)

    @classmethod
    def tearDownClass(cls):
        os.remove("_quarto.yaml")
        shutil.rmtree(".quarto")

    def _test_report(self, dataset_name: str, report_type: str):
        dataset_file, class_attribute, problem_type = DATASET_MAPPING[dataset_name]
        dataset = self._load_dataset(dataset_file)
        settings = DatasetSettings(
            name="test", dataset=dataset, class_attribute=class_attribute
        )
        report_class = REPORT_MAPPING[problem_type][report_type]
        request = report_class(
            title="Test Report",
            problem_type=problem_type,
            dataset=settings,
        )
        # patch to include all algorithms
        for field_name in request.algorithms.__dict__:
            field_value = getattr(request.algorithms, field_name)
            if isinstance(field_value, bool):
                setattr(request.algorithms, field_name, True)
        # patch to include all preprocessing steps
        for field_name in request.preprocessing.__dict__:
            field_value = getattr(request.preprocessing, field_name)
            if isinstance(field_value, bool):
                setattr(request.preprocessing, field_name, True)
        filename = f"{dataset_name}_{report_type}"
        report = generate_report(request, filename)
        try:
            self.assertTrue(
                os.path.exists(report),
                "Failed to generate {} report for `{}` ({}).".format(
                    report_type, dataset_name, problem_type),
            )
        finally:
            self._remove_execution_files(report)

    def _load_dataset(self, filename: str) -> str:
        dataset_path = pathlib.Path(__file__).parent / "data" / filename
        dataset = pd.read_csv(dataset_path)
        # take a sample of the dataset to reduce report generation time
        if len(dataset) > 250:
            dataset = dataset.sample(250)
        return dataset.to_json()

    def _remove_execution_files(self, filename):
        name = filename.split(".")[0]
        # remove all execution files except for the report itself
        data_paths = [path for path in os.listdir(
        ) if name in path and path != filename]
        for path in data_paths:
            if os.path.isfile(path):
                os.remove(path)
            else:
                shutil.rmtree(path)


class ClassificationTestCase(BaseReportGenerationTestCase):

    def test_classification_iris_discovery(self):
        self._test_report("iris", "discovery")

    def test_classification_iris_prediction(self):
        self._test_report("iris", "prediction")

    def test_classification_diabetes_discovery(self):
        self._test_report("diabetes", "discovery")

    def test_classification_diabetes_prediction(self):
        self._test_report("diabetes", "prediction")

    def test_classification_zoo_discovery(self):
        self._test_report("zoo", "discovery")

    def test_classification_zoo_prediction(self):
        self._test_report("zoo", "prediction")


class RegressionTestCase(BaseReportGenerationTestCase):
    def test_regression_boston_discovery(self):
        self._test_report("boston", "discovery")

    def test_regression_boston_prediction(self):
        self._test_report("boston", "prediction")

    def test_regression_california_discovery(self):
        self._test_report("california", "discovery")

    def test_regression_california_prediction(self):
        self._test_report("california", "prediction")

    def test_regression_diabetes_reg_discovery(self):
        self._test_report("diabetes_reg", "discovery")

    def test_regression_diabetes_reg_prediction(self):
        self._test_report("diabetes_reg", "prediction")


class SurvivalTestCase(BaseReportGenerationTestCase):
    def test_survival_bone_marrow_discovery(self):
        self._test_report("bone_marrow", "discovery")

    def test_survival_bone_marrow_prediction(self):
        self._test_report("bone_marrow", "prediction")

    def test_survival_BHS_discovery(self):
        self._test_report("BHS", "discovery")

    def test_survival_BHS_prediction(self):
        self._test_report("BHS", "prediction")

    def test_survival_veteran_discovery(self):
        self._test_report("veteran", "discovery")

    def test_survival_veteran_prediction(self):
        self._test_report("veteran", "prediction")
