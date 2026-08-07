import { EntityState } from '@ngrx/entity';

import { DatasetStatisticsSummary } from '../../../main/project/dataset/models/dataset-statistics';
import { ClassificationMeta, RegressionMeta, RuleCoverage, SurvivalMeta } from '../../../main/project/models/ruleset';

export type V2RulesTable = {
  id: string; //ngrx store id
  state: string; //devextreme table state
  meta: V2RulesTableMeta;
  data: V2RulesTableData; //table data
  shouldGoToTheFirstPageOnSort: boolean;
  activeRowsUuids: string[];
  filteredRowsUuids: string[];
  compareRowsUuids: string[];
  coverage: RuleCoverage;
  coverageNeedsRefetch: boolean;
  rulesWithOutdatedCoverages: any; //TODO add type
  labelMinMaxValues?: v2LabelMinMaxValues;
  attributesMinMaxValues: v2AttributeMinMaxValues;
  statistics?: DatasetStatisticsSummary;
  undoStack: EntityState<v2TableUndoData>;
  redoStack: EntityState<v2TableUndoData>;
  containsAlternatives: boolean;
};

export type V2RulesTableData = any[]; //TODO add type

export type V2RulesTableMeta = ClassificationMeta | RegressionMeta | SurvivalMeta;

export type V2RulesTableStateInterface = EntityState<V2RulesTable | null>;
export type V2RulesTableState = EntityState<V2RulesTable>;

export type v2LabelMinMaxValues = {
  min: number;
  max: number;
};

export type v2AttributeMinMaxValues = { [key: string]: v2LabelMinMaxValues };

export enum v2TableUndoActions {
  ADD = 'add',
  ADD_MULTIPLE = 'add_multiple',
  EDIT = 'edit',
  REMOVE = 'remove',
}
export type v2TableUndoData = {
  id: number; //ngrx id
  rowUuids: string[];
  rows: any[];
  originalRow?: any; // For undo redo edit we need to keep the original row
  action: v2TableUndoActions;
};

export type UndoRedoAction = {
  key: string;
  actionType: 'undo' | 'redo';
  data: v2TableUndoData;
};
