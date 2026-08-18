import { ColumnTypes, ProblemTypes } from '../../../data-upload/utils/enums';

export interface Dataset {
  name: string;
  description: string;
  selected_columns: number[];
  assigned_column_types: string[];
  assigned_column_classes: string[];
}

export interface GetDataSet extends Pick<Dataset, 'name'> {
  id: number;
}

export interface RuleSet {
  id: number;
  name: string;
}

export interface Column {
  name: string;
  column_type: ColumnTypes;
  role: string;
}

export interface DataSourceLoadResult {
  data: any[];
  totalCount: number;
}

export interface TableRecord {
  id: number;
  column_values: (string | number)[];
}

export interface DatasetResponse {
  limit: number;
  offset: number;
  count: number;
  columns: Column[];
  records: TableRecord[];
}

export interface DatasetData {
  limit: number;
  offset: number;
  count: number;
  columns: Column[];
  records: Record<string, any>[];
}

export interface DataSetDetailsRequest {
  name: string;
  description?: string;
  clone_related?: boolean;
}

export interface AttributeMinMaxValue {
  min: number;
  max: number;
}

export interface AttributeMinMaxValues {
  labelMinMaxValues: AttributeMinMaxValue;
  attributesMinMaxValues: {
    [key: string]: AttributeMinMaxValue;
  };
}

export type ContextMenuItemType = 'classify';

export enum DatasetAttributesTypes {
  NUMERICAL = 'num',
  CATEGORICAL = 'cat',
}

export enum DatasetAttributesRoles {
  ATTRIBUTE = 'attr',
  LABEL = 'class',
  SURVIVAL_TIME = 'survival_time',
}

export interface DatasetAttribute {
  id: number;
  name: string;
  type: DatasetAttributesTypes;
  role: DatasetAttributesRoles;
}

export interface RuleSetImportAlgorithm {
  id: number;
  name: string;
  implementation_url: string;
  description_pl: string;
  description_en: string;
  supported_problem_types: Array<ProblemTypes>;
}
