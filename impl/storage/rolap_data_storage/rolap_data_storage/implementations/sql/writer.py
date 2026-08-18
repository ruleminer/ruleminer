import pandas as pd
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError

from ...abstract import AbstractDatasetWriter
from .exceptions import DBStorageException


class DBDatasetWriter(AbstractDatasetWriter):

    def __init__(self, path: str, engine: Engine):
        super().__init__(path=path)
        self._table = self._path
        self.engine = engine

    def write(self, df: pd.DataFrame):
        """Write dataframe to SQL database. Replace if exists."""
        try:
            with self.engine.connect() as conn:
                df.to_sql(
                    name=self._table,
                    con=conn,
                    if_exists="replace",
                    index=True,
                    index_label="index",
                )
                conn.commit()
        except OperationalError as e:
            raise DBStorageException(
                f"Invalid database connection configuration: {str(e)}")
