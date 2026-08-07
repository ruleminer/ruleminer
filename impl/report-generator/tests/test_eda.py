import unittest

import pandas as pd
from ydata_profiling import ProfileReport


class EDAReportTest(unittest.TestCase):
    def test_eda_report(self):
        df = pd.read_csv("tests/iris.csv")
        report = ProfileReport(df, title="test")
        html_report = report.to_html()
        self.assertNotEqual(html_report, "")
