from typing import Any
from typing import Optional

import pandas as pd
from sqlalchemy import and_
from sqlalchemy import ColumnElement
from sqlalchemy import func
from sqlalchemy import MetaData
from sqlalchemy import or_
from sqlalchemy import Select
from sqlalchemy import select
from sqlalchemy import Table
from sqlalchemy.engine import Engine
from sqlalchemy.exc import NoSuchTableError
from sqlalchemy.exc import OperationalError
from sqlalchemy.sql.compiler import SQLCompiler
from sqlalchemy.sql.sqltypes import Integer
from sqlalchemy.sql.sqltypes import Numeric
from sqlalchemy.sql.sqltypes import String
from sqlalchemy.sql.elements import ColumnElement

from ...abstract import AbstractDatasetReader
from ...abstract import FilterConnector
from ...abstract import FilterList
from ...abstract import FilterOperators
from ...abstract import SortInfo
from .exceptions import DBStorageException


class DBDatasetReader(AbstractDatasetReader):

    def __init__(self, path: str, engine: Engine):
        super().__init__(path=path)
        self._table: str = self._path
        self.engine: Engine = engine

        # initialize data for query parameters
        self._selected_columns: Optional[list[str]] = None
        self._filters_info: FilterList = FilterList(
            connector=FilterConnector.AND, filters=[])
        self._sort_info: list[SortInfo] = []
        self._limit: Optional[int] = None
        self._offset: int = 0

    def select_columns(self, columns: list[str]):
        if columns is not None and "index" not in columns:
            columns = ["index", *columns]
        self._selected_columns = columns

    def filter(self, filters_info: FilterList):
        self._filters_info = filters_info

    def sort(self, sort_info: list[SortInfo]):
        self._sort_info = sort_info

    def limit(self, limit: int, offset: int = 0):
        self._limit = limit
        self._offset = offset

    def _get_orm(self) -> Table:
        """Get ORM for the requested dataset table using reflection."""
        metadata_obj = MetaData()
        try:
            table_orm = Table(
                self._table,
                metadata_obj,
                autoload_with=self.engine
            )
        except OperationalError as e:
            raise DBStorageException(
                f"Invalid database connection configuration: {str(e)}")
        except NoSuchTableError:
            raise DBStorageException(
                "The requested dataset does not exist in the database")
        return table_orm

    def read(self) -> pd.DataFrame:
        """
        Read data from DB using an SQL query constructed
        from column selection, filters, sorting and limit.
        """
        query = self._construct_query()
        with self.engine.connect() as conn:
            df = pd.read_sql_query(
                sql=query,
                con=conn,
                index_col="index",
            )
        if df.empty:
            self.total_count = 0
        else:
            self.total_count = df["total_count_for_pagination"].iloc[0]
        df = df.drop("total_count_for_pagination", axis=1)
        return df

    def _construct_query(self) -> SQLCompiler:
        """Construct `Selectable` object to be passed to pandas `read_sql()` method."""
        table = self._get_orm()
        # initialize query - select all or selected columns
        count_selection = func.count(table.c.index).over().label(
            "total_count_for_pagination")
        if self._selected_columns:
            try:
                selections = [getattr(table.c, col)
                              for col in self._selected_columns]
                query = select(*selections, count_selection)
            except AttributeError:
                raise DBStorageException("Invalid column selection")
        else:
            query = select(table, count_selection)
        query = self._apply_filters(query, table)
        query = self._apply_sorting(query, table)
        query = self._apply_limits(query)
        compiled_query = query.compile(
            dialect=self.engine.dialect, compile_kwargs={"literal_binds": True})
        return compiled_query

    def _apply_filters(self, query: Select, table: Table) -> Select:
        """Apply selected filter to the SQL query."""
        # by default, it will be empty, so we check if it has been changed
        if not self._filters_info.filters:
            return query
        try:
            expression = self._process_filter_list(table, self._filters_info)
            query = query.where(expression)
        except AttributeError:
            raise DBStorageException(
                "Invalid columns passed as arguments for filtering")
        except Exception as e:
            raise DBStorageException(str(e))
        return query

    def _process_filter_list(self, table: Table, filter_list: FilterList):
        """Translate filter list into SQLAlchemy expressions"""
        connector_map = {
            FilterConnector.AND: and_,
            FilterConnector.OR: or_,
        }
        connector = connector_map[filter_list.connector]
        expressions = []
        for filter_ in filter_list.filters:
            if isinstance(filter_, FilterList):
                expression = self._process_filter_list(table, filter_)
            else:
                col: ColumnElement = getattr(table.c, filter_["column_name"])
                if filter_.get("value_is_column", False):
                    value: ColumnElement = getattr(table.c, filter_["value"])

                else:
                    value = filter_["value"]
                    if type(value) in [list, tuple]:
                        value = [self._cast_to_type(v, col) for v in value]
                    else:
                        value = self._cast_to_type(value, col)
                expression = self._process_expression(
                    col, value, filter_["operator"])
            expressions.append(expression)
        return connector(*expressions)

    @staticmethod
    def _cast_to_type(value, column):
        if isinstance(value, ColumnElement):
            return value
        if isinstance(column.type, Integer) or isinstance(column.type, Numeric):
            return float(value)
        elif isinstance(column.type, String):
            return str(value)
        else:
            return value

    @staticmethod
    def _process_expression(col: ColumnElement, value: Any, operator: FilterOperators):
        """Construct SQLAlchemy expression for a single filter."""
        if col.type.python_type == str and not isinstance(value, ColumnElement):
            def equal_expr(): return col.like(value)
            def unequal_expr(): return col.notlike(value)
        else:
            def equal_expr(): return col == value
            def unequal_expr(): return col != value
        filter_mapping = {
            FilterOperators.equal: lambda: equal_expr,
            FilterOperators.not_equal: lambda: unequal_expr,
            FilterOperators.greater: lambda: (col > value),
            FilterOperators.greater_equal: lambda: (col >= value),
            FilterOperators.lower: lambda: (col < value),
            FilterOperators.lower_equal: lambda: (col <= value),
            FilterOperators.is_in: lambda: (col.in_(value)),
            FilterOperators.is_not_in: lambda: (col.not_in(value)),
            FilterOperators.icontains: lambda: (col.icontains(value)),
            FilterOperators.istartswith: lambda: (col.istartswith(value)),
        }
        return filter_mapping[operator]()

    def _apply_sorting(self, query: Select, table: Table) -> Select:
        """Apply sorting to the SQL query."""
        try:
            for sort_column in self._sort_info:
                col = getattr(table.c, sort_column["column_name"])
                if sort_column["ascending"]:
                    query = query.order_by(col.asc())
                else:
                    query = query.order_by(col.desc())
        except AttributeError:
            raise DBStorageException(
                "Invalid columns passed as arguments for sorting")
        return query

    def _apply_limits(self, query: Select) -> Select:
        """Apply limits to the SQL query."""
        if self._limit is not None:
            query = query.limit(self._limit)
        else:
            query = query.limit(None)
        if self._offset != 0:
            query = query.offset(self._offset)
        else:
            query = query.offset(None)
        return query

    def delete(self):
        table = self._get_orm()
        table.drop(self.engine)
