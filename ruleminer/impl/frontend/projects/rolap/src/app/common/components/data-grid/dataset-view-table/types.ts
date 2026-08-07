import { SingleMultipleOrNone } from 'devextreme/common';

import { defaultDevExtremePageSizes } from '../../../utils/dataGridUtils';

export interface FilteredColumns {
  name: string;
  role: string;
}

export interface ColumnDefinition {
  dataField: string;
  caption: string;
  visible: boolean;
  visibleIndex?: number;
  showInColumnChooser: boolean;
}

export enum DatasetViewTableType {
  DATA_SET_VIEW = 'dataSetView',
  RULE_SET_EXAMPLE_MODAL = 'ruleSetExampleModal',
  RULE_SET_PREDICTION_RESULT = 'predictionResult',
  RULE_SET_COVERAGE = 'coverage',
}

export const DatasetViewTableTypeConfig = {
  [DatasetViewTableType.DATA_SET_VIEW]: {
    allowedPageSizes: defaultDevExtremePageSizes,
    pageSize: defaultDevExtremePageSizes[2],
    height: undefined,
    selectionMode: 'multiple',
    numericalFilterOperations: ['=', '<>', '<', '>', '<=', '>=', 'between'],
    nominalFilterOperations: ['startswith', '=', '<>', 'contains'],
    hasContextMenu: true,
  },
  [DatasetViewTableType.RULE_SET_EXAMPLE_MODAL]: {
    allowedPageSizes: defaultDevExtremePageSizes,
    pageSize: 25,
    height: '70vh',
    selectionMode: 'single',
    numericalFilterOperations: ['=', '<>', '<', '>', '<=', '>=', 'between'],
    nominalFilterOperations: ['startswith', '=', '<>', 'contains'],
    hasContextMenu: false,
  },
  [DatasetViewTableType.RULE_SET_PREDICTION_RESULT]: {
    allowedPageSizes: defaultDevExtremePageSizes,
    pageSize: defaultDevExtremePageSizes[2],
    height: undefined,
    selectionMode: 'none',
    numericalFilterOperations: ['=', '<>', '<', '>', '<=', '>=', 'between'],
    nominalFilterOperations: ['startswith', '=', '<>', 'contains'],
    hasContextMenu: false,
  },
  [DatasetViewTableType.RULE_SET_COVERAGE]: {
    allowedPageSizes: defaultDevExtremePageSizes,
    pageSize: defaultDevExtremePageSizes[2],
    height: undefined,
    selectionMode: 'multiple',
    numericalFilterOperations: ['=', '<>', '<', '>', '<=', '>=', 'between'],
    nominalFilterOperations: ['startswith', '=', '<>', 'contains'],
    hasContextMenu: false,
  },
} as const;

export interface DatasetViewTableComponentSettings {
  allowedPageSizes: string | (string | number)[];
  pageSize: number;
  height: string | undefined;
  selectionMode: SingleMultipleOrNone;
  numericalFilterOperations: string[];
  nominalFilterOperations: string[];
  hasContextMenu: boolean;
}
