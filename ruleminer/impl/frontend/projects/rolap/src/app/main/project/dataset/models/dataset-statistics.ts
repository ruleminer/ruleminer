export interface DatasetStatistics {
  headers: StatisticsHeader[];
  columns: DatasetStatisticsColumn[];
  summary: DatasetStatisticsSummary;
}

export interface DatasetStatisticsSummary {
  number_of_rows: number;
  number_of_columns: number;
}

export interface DatasetStatisticsColumn {
  column_name: string;
  column_role: string;
  statistics: AttributeStatistic[];
}

export interface AttributeStatistic {
  name: string;
  value: string;
}

export interface StatisticsHeader {
  name: string;
  description_id: string;
}

export interface UnimportantAttributes {
  Missing: string[];
  'Text-ness': string[];
  'ID-ness': string[];
  Stability: string[];
}

export interface DecisionAttributesSummary {
  label: string | null;
  survivalTime: string | null;
  isSurvival: boolean;
}
