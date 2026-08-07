from dataclasses import dataclass
from typing import List


@dataclass
class Statistic(object):
    name: str
    value: str


@dataclass
class ColumnStatistics(object):
    column_name: str
    column_role: str
    statistics: List[Statistic]


@dataclass
class StatisticsHeader(object):
    name: str
    description_id: str


@dataclass
class StatisticsResponse(object):
    headers: List[StatisticsHeader]
    columns: List[ColumnStatistics]
    summary: dict
