# pylint: disable=missing-module-docstring,missing-class-docstring,missing-function-docstring
import subprocess
import time
import unittest
import uuid
from unittest import skip

from rolap_data_storage.abstract import FilterConnector
from rolap_data_storage.abstract import FilterInfo
from rolap_data_storage.abstract import FilterList
from rolap_data_storage.abstract import FilterOperators
from rolap_data_storage.abstract import SortInfo
from rolap_data_storage.implementations.sql import DBStorage
from rolap_data_storage.implementations.sql import DBStorageConfig
from rolap_data_storage.implementations.sql import DBStorageException
from sqlalchemy import text
from tests.resources import read_dataset_from_resources


class BaseTestSetup:
    class BaseTest(unittest.TestCase):
        # user and DB below have to be created before starting tests
        postgres_version = '15.2'
        user = "test_storage"
        password = "test_storage"
        host = "localhost"
        port = "3243"
        db_name = "test_storage"
        TEST_CONFIG = DBStorageConfig(
            user=user, password=password, host=host, port=port, db_name=db_name
        )
        db_container_name: str = None

        def setUp(self):
            self.storage = DBStorage(self.TEST_CONFIG)
            self.run_test_db()

        def run_test_db(self):
            self.db_container_name = f'rolap_data_storage_test_db--{str(uuid.uuid4())}'  # noqa
            self.db_container_uuid = subprocess.getoutput(
                f'docker run --name {self.db_container_name} -e POSTGRES_USER={self.user} ' +
                f'-e POSTGRES_PASSWORD={self.password} -e POSTGRES_DB={self.db_name} '
                f'-d -p {self.port}:5432 postgres:{self.postgres_version}'
            )
            time.sleep(2)

        def tearDown(self):
            self.storage.dispose()
            subprocess.getoutput(f'docker stop {self.db_container_name}')
            subprocess.getoutput(f'docker rm --force {self.db_container_name}')


@skip("Tested in integration tests within portal-service")
class TestDBDatasetStorage(BaseTestSetup.BaseTest):
    def test_write_dataset(self):
        writer = self.storage.get_dataset_writer("anneal")
        df = read_dataset_from_resources("anneal")
        writer.write(df)
        with writer.engine.connect() as conn:
            results = conn.execute(text("SELECT * FROM anneal;"))
        results = results.fetchall()
        self.assertEqual(len(results), 898)


@skip("Tested in integration tests within portal-service")
class TestDBDatasetReader(BaseTestSetup.BaseTest):
    def setUp(self):
        super().setUp()
        writer_anneal = self.storage.get_dataset_writer("anneal")
        df_anneal = read_dataset_from_resources("anneal")
        writer_anneal.write(df_anneal)
        writer_bone_marrow = self.storage.get_dataset_writer("bone_marrow")
        df_bone_marrow = read_dataset_from_resources("bone_marrow")
        writer_bone_marrow.write(df_bone_marrow)
        self.reader = self.storage.get_dataset_reader("anneal")

    def test_read_whole_dataset(self):
        df = self.reader.read()
        self.assertEqual(len(df), 898)

    def test_read_columns(self):
        columns = ["carbon", "hardness"]
        self.reader.select_columns(columns)
        df = self.reader.read()
        self.assertEqual(df.shape[1], 2)
        self.assertEqual(list(df.columns), columns)

    def test_filter1(self):
        filter_list = [
            FilterInfo(column_name="strength",
                       operator=FilterOperators.greater, value=0),
            FilterInfo(column_name="width",
                       operator=FilterOperators.greater, value=0.5),
        ]
        filters = FilterList(
            connector=FilterConnector.AND,
            filters=filter_list,
        )
        self.reader.filter(filters)
        df = self.reader.read()
        self.assertEqual(df.shape[0], 30)

    def test_filter2(self):
        filter_list = [
            FilterInfo(column_name="strength",
                       operator=FilterOperators.greater, value=0),
            FilterInfo(column_name="width",
                       operator=FilterOperators.greater, value=0.5),
        ]
        filters = FilterList(
            connector=FilterConnector.OR,
            filters=filter_list,
        )
        self.reader.filter(filters)
        df = self.reader.read()
        self.assertEqual(df.shape[0], 373)

    def test_filter3(self):
        filters1 = FilterList(
            connector=FilterConnector.AND,
            filters=[
                FilterInfo(column_name="strength",
                           operator=FilterOperators.greater, value=0),
                FilterInfo(column_name="width",
                           operator=FilterOperators.greater, value=0.5),
            ],
        )
        filters2 = FilterList(
            connector=FilterConnector.AND,
            filters=[FilterInfo(column_name="hardness",
                                operator=FilterOperators.greater, value=0)],
        )
        filters = FilterList(
            connector=FilterConnector.OR,
            filters=[filters1, filters2]
        )
        self.reader.filter(filters)
        df = self.reader.read()
        self.assertEqual(df.shape[0], 207)

    def test_sort(self):
        self.reader.sort([SortInfo(column_name="hardness", ascending=False)])
        df = self.reader.read()
        self.assertEqual(df["hardness"].iloc[0], 1.0)

    def test_limit(self):
        self.reader.limit(10, 0)
        df = self.reader.read()
        self.assertEqual(df.shape[0], 10)
        self.assertEqual(df["thick"].iloc[-1], 0.2021276595744681)

    def test_read_nonexistent(self):
        reader = self.storage.get_dataset_reader("something")
        with self.assertRaises(DBStorageException):
            reader.read()

    def test_select_wrong_columns(self):
        columns = ["some_column"]
        with self.assertRaises(DBStorageException):
            self.reader.select_columns(columns)
            self.reader.read()

    def test_attributes_relation_condition(self):
        # donor_age > recipient_body_mass
        self.reader = self.storage.get_dataset_reader("bone_marrow")
        filter_info = FilterInfo(
            column_name="donor_age",
            operator=FilterOperators.greater,
            value="recipient_body_mass",
            value_is_column=True
        )
        filters = FilterList(
            connector=FilterConnector.AND,
            filters=[filter_info]
        )
        self.reader.filter(filters)
        df = self.reader.read()
        self.assertTrue((df["donor_age"] > df["recipient_body_mass"]).all())

    def test_nominal_attributes_equality_condition(self):
        # recipient_ABO == donor_ABO
        self.reader = self.storage.get_dataset_reader("bone_marrow")
        filter_info = FilterInfo(
            column_name="recipient_ABO",
            operator=FilterOperators.equal,
            value="donor_ABO",
            value_is_column=True
        )
        filters = FilterList(
            connector=FilterConnector.AND,
            filters=[filter_info]
        )
        self.reader.filter(filters)
        df = self.reader.read()
        self.assertTrue((df["recipient_ABO"] == df["donor_ABO"]).all())

    def test_discrete_set_condition(self):
        # recipient_ABO in {"A", "B", "AB"}
        self.reader = self.storage.get_dataset_reader("bone_marrow")
        filter_info = FilterInfo(
            column_name="recipient_ABO",
            operator=FilterOperators.is_in,
            value=["A", "B", "AB"]
        )
        filters = FilterList(
            connector=FilterConnector.AND,
            filters=[filter_info]
        )
        self.reader.filter(filters)
        df = self.reader.read()
        self.assertTrue(df["recipient_ABO"].isin(["A", "B", "AB"]).all())

    def test_survival_time_greater_than_100(self):
        # survival_time > 100
        self.reader = self.storage.get_dataset_reader("bone_marrow")
        filter_info = FilterInfo(
            column_name="survival_time",
            operator=FilterOperators.greater,
            value=100
        )
        filters = FilterList(
            connector=FilterConnector.AND,
            filters=[filter_info]
        )
        self.reader.filter(filters)
        df = self.reader.read()
        self.assertTrue((df["survival_time"] > 100).all())


if __name__ == '__main__':
    unittest.main()
