import { EntityState } from '@ngrx/entity';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { pick } from 'lodash';

import { Label } from '../../components/label/interfaces/label.model';
import { mapBackendColumnNameToTranslateValue } from '../../utils/dataGridUtils';
import { AppState } from '../app-state.model';
import { activeProjectSelector } from '../project/project.selectors';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { selectCurrentV2TabDataSetText, selectCurrentV2TabIds } from '../v2Tabs/v2Tabs.selectors';
import { V2RulesTable, V2RulesTableState, v2TableUndoData } from './types';
import { V2RulesTableAdapter, v2RedoStackAdapter, v2UndoStackAdapter } from './v2RulesTable.reducer';

const { selectIds, selectEntities, selectAll, selectTotal } = V2RulesTableAdapter.getSelectors();

export const selectFeature = (state: AppState) => state.v2RulesTable;

export const selectV2RulesTableIds = createSelector(selectFeature, selectIds);
export const selectV2RulesTableEntities = createSelector(selectFeature, selectEntities);
export const selectAllV2RulesTable = createSelector(selectFeature, selectAll);
export const selectV2RulesTableTotal = createSelector(selectFeature, selectTotal);

const feature = createFeatureSelector<V2RulesTableState>('v2RulesTable');

export const selectRulesTableEntities = createSelector(feature, selectEntities);

export const selectCurrentV2RulesTable = createSelector(
  selectRulesTableEntities,
  selectCurrentV2TabId,
  (entities, currentId) => entities[currentId],
);

export const selectCurrentV2RulesTableState = createSelector(selectCurrentV2RulesTable, (rulesTable) => {
  if (rulesTable === undefined) return undefined;
  return rulesTable.state;
});

export const selectCurrentV2RulesTableMeta = createSelector(selectCurrentV2RulesTable, (rulesTable) => {
  if (rulesTable === undefined) return undefined;
  return rulesTable.meta;
});

export const selectCurrentV2RulesDecisionAttribute = createSelector(selectCurrentV2RulesTableMeta, (meta) => {
  if (meta === undefined) return undefined;
  return meta.decision_attribute;
});

export const selectCurrentV2RulesTableActiveUuids = createSelector(selectCurrentV2RulesTable, (rulesTable) => {
  if (rulesTable === undefined) return null;
  return rulesTable.activeRowsUuids;
});

/**
 * Get filtered uuids
 */
export const selectCurrentV2RulesTableFilteredUuids = createSelector(selectCurrentV2RulesTable, (rulesTable) => {
  if (rulesTable === undefined) return null;
  return rulesTable.filteredRowsUuids;
});

/**
 * Determine if the number of filtered rows is zero
 */
export const selectCurrentV2RulesTableIsNumberOfFilteredRowZero = createSelector(
  selectCurrentV2RulesTableFilteredUuids,
  (filteredUuids) => (filteredUuids?.length ?? 0) === 0,
);

export const selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered = createSelector(
  selectCurrentV2RulesTableFilteredUuids,
  selectCurrentV2RulesTableActiveUuids,
  (filteredUuids, activeUuids) => {
    if (!filteredUuids || !activeUuids) return null;
    return activeUuids.filter((uuid) => filteredUuids.includes(uuid));
  },
);

export const selectCurrentV2RulesTableCompareUuids = createSelector(selectCurrentV2RulesTable, (rulesTable) => {
  if (rulesTable === undefined) return null;
  return rulesTable.compareRowsUuids;
});

export const selectCurrentV2RulesTableActiveHeaderCheckboxValue = createSelector(
  selectCurrentV2RulesTable,
  (rulesTable) => {
    if (rulesTable === undefined) return undefined;
    const allRulesCount = rulesTable.data?.length || 0;
    const selectedRulesCount = rulesTable.activeRowsUuids?.length || 0;
    if (selectedRulesCount === 0 || allRulesCount === 0) return false;
    return allRulesCount === selectedRulesCount;
  },
);

export const selectCurrentV2RulesTableData = createSelector(selectCurrentV2RulesTable, (rulesTable) => {
  if (rulesTable === undefined) return undefined;
  return rulesTable.data;
});

export const selectCurrentV2RulesShouldGoToTheFirstPageOnSort = createSelector(
  selectCurrentV2RulesTable,
  (rulesTable) => {
    if (rulesTable === undefined) return false;
    return rulesTable.shouldGoToTheFirstPageOnSort;
  },
);

export const selectCurrentV2RulesTableCoverage = createSelector(
  selectCurrentV2RulesTable,
  selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered,
  (rulesTable, filteredUuids) => {
    if (rulesTable === undefined) return undefined;
    if (filteredUuids === null) return undefined;
    return pick(rulesTable.coverage, filteredUuids);
  },
);

export const selectCurrentV2RulesTableCoverageNeedsRefetch = createSelector(selectCurrentV2RulesTable, (rulesTable) => {
  if (rulesTable === undefined) return undefined;
  return rulesTable.coverageNeedsRefetch;
});

export const selectCurrentV2RulesTableRulesWithOutdatedCoverages = createSelector(
  selectCurrentV2RulesTable,
  (rulesTable) => {
    if (rulesTable === undefined) return undefined;
    return rulesTable.rulesWithOutdatedCoverages;
  },
);

export const selectCurrentV2RulesTableLabelMinMaxValues = createSelector(selectCurrentV2RulesTable, (rulesTable) => {
  if (rulesTable === undefined) return undefined;
  return rulesTable.labelMinMaxValues;
});

export const selectCurrentV2RulesTableAttributesMinMaxValues = createSelector(
  selectCurrentV2RulesTable,
  (rulesTable) => {
    if (rulesTable === undefined) return undefined;
    return rulesTable.attributesMinMaxValues;
  },
);

/**
 * Get ruleset in standard form fitted for API (with meta and rules fields)
 */
export const getRuleSet = createSelector(selectCurrentV2RulesTable, (v2Table) => {
  if (!v2Table) return undefined;
  const v2RulesTableData = v2Table.data;
  if (v2RulesTableData === undefined) return undefined;
  return {
    meta: v2Table.meta,
    rules: v2Table.data.map((item: any) => {
      return {
        uuid: item.uuid,
        string: item.string,
        premise: item.premise,
        conclusion: item.conclusion,
      };
    }),
  };
});

export const getRuleSetWithActive = createSelector(
  selectCurrentV2RulesTable,
  selectCurrentV2RulesTableActiveUuids,
  selectCurrentV2RulesTableFilteredUuids,
  (v2Table, activeUuids, filteredUuids) => {
    if (!v2Table || !activeUuids) return undefined;
    const v2RulesTableData = v2Table.data;
    if (v2RulesTableData === undefined) return undefined;
    return {
      meta: v2Table.meta,
      rules: v2Table.data
        .filter((item) => activeUuids.includes(item.uuid) && filteredUuids?.includes(item.uuid))
        .map((item: any) => {
          return {
            uuid: item.uuid,
            string: item.string,
            premise: item.premise,
            conclusion: item.conclusion,
            active: item.active,
          };
        }),
    };
  },
);

export const getRulesToCompare = createSelector(
  selectCurrentV2RulesTable,
  selectCurrentV2RulesTableCompareUuids,
  selectCurrentV2RulesTableFilteredUuids,
  (v2RulesTable, compareRowsUuids, filteredUuids) => {
    if (!v2RulesTable || !compareRowsUuids) return undefined;
    return {
      table: v2RulesTable.data.filter(
        (row: any) => compareRowsUuids.includes(row.uuid) && filteredUuids?.includes(row.uuid),
      ),
      meta: v2RulesTable.meta,
    };
  },
);

export const getRulesLabels = createSelector(
  selectCurrentV2RulesTable,
  selectCurrentV2RulesTableActiveUuids,
  (v2RulesTable, activeRowsUuids) => {
    if (!v2RulesTable || !v2RulesTable.data || activeRowsUuids === null) return null;
    const obj: Record<string, number[]> = {};
    for (let i = 0; i < v2RulesTable.data.length; i++) {
      // saves labels only for active rules
      if (activeRowsUuids.includes(v2RulesTable.data[i].uuid)) {
        obj[v2RulesTable.data[i].uuid] = v2RulesTable.data[i].labels
          ? v2RulesTable.data[i].labels.map((x: Label) => x.id)
          : [];
      }
    }
    return obj;
  },
);

export const getLabelsFromRule = (ruleUuid: string) =>
  createSelector(selectCurrentV2RulesTable, (v2RulesTable) => {
    if (!v2RulesTable) return null;
    const rule = v2RulesTable.data.find((x) => x.uuid === ruleUuid);
    if (!rule) return null;

    return rule.labels as Label[];
  });

export const canDeleteOrDeactivateRules = createSelector(selectCurrentV2RulesTableActiveUuids, (activeRowsUuids) => {
  if (!activeRowsUuids) return false;
  return activeRowsUuids.length > 1;
});

/**
 * Get big rules table columns names in the naming convention used in backend (snake_case)
 */
export const getRulesBigTableVisibleColumnsBackendKeys = createSelector(
  selectCurrentV2RulesTableData,
  selectCurrentV2RulesTableState,
  (v2RulesTableData, tableState) => {
    if (v2RulesTableData === undefined || v2RulesTableData.length === 0 || tableState === undefined) {
      return [];
    }
    const allBackendKeys: string[] = Object.keys(v2RulesTableData[0]);
    const visibleColumns: string[] = JSON.parse(tableState)
      .columns.filter((c: any) => c.visible)
      .map((c: any) => c.name);

    // visible columns are not in the same naming convention as backend keys, need to map them
    const visibleColumnsToBackendKeysMap: Map<string, string> = new Map(
      allBackendKeys.map((key) => [mapBackendColumnNameToTranslateValue(key), key]),
    );

    // filter only visible columns
    const visibleColumnsBackendKeys: string[] = visibleColumns
      .filter((c: string) => visibleColumnsToBackendKeysMap.has(c))
      .map((c: string) => {
        return visibleColumnsToBackendKeysMap.get(c) as string;
      });
    return visibleColumnsBackendKeys;
  },
);
/* UNDO STACK */
// Selector to get the undo stack from the current V2RulesTable
export const selectCurrentV2RulesTableUndoStack = createSelector(
  selectCurrentV2RulesTable,
  (rulesTable: V2RulesTable | undefined) => (rulesTable ? rulesTable.undoStack : undefined),
);

// Selector to get the IDs from the undo stack
export const selectUndoStackIds = createSelector(
  selectCurrentV2RulesTableUndoStack,
  (undoStack: EntityState<v2TableUndoData> | undefined) =>
    undoStack ? v2UndoStackAdapter.getSelectors().selectIds(undoStack) : [],
);

// Select nested undoStack entities
export const selectUndoStackEntities = createSelector(selectCurrentV2RulesTable, (rulesTable) =>
  rulesTable ? v2UndoStackAdapter.getSelectors().selectAll(rulesTable.undoStack) : [],
);

/* REDO STACK */
export const selectCurrentV2RulesTableRedoStack = createSelector(
  selectCurrentV2RulesTable,
  (rulesTable: V2RulesTable | undefined) => (rulesTable ? rulesTable.redoStack : undefined),
);

// Selector to get the IDs from the redo stack
export const selectRedoStackIds = createSelector(
  selectCurrentV2RulesTableUndoStack,
  (redoStack: EntityState<v2TableUndoData> | undefined) =>
    redoStack ? v2UndoStackAdapter.getSelectors().selectIds(redoStack) : [],
);

// Select nested uredoStack entities
export const selectRedoStackEntities = createSelector(selectCurrentV2RulesTable, (rulesTable) =>
  rulesTable ? v2RedoStackAdapter.getSelectors().selectAll(rulesTable.redoStack) : [],
);

/**
 * Get data object for big rules table
 */
export const selectProjectRulesTableData = createSelector(
  selectCurrentV2TabIds,
  selectCurrentV2TabDataSetText,
  activeProjectSelector,
  selectCurrentV2RulesTableData,
  (v2TabIds, dataSetText, activeProject, v2RulesTableData) => {
    if (!v2TabIds || !activeProject || !v2RulesTableData) return null;
    const ids = {
      ruleSetId: v2TabIds?.ruleSetId as number,
      dataSetId: v2TabIds?.dataSetId as number,
      projectId: activeProject.id,
    };

    return {
      dataSetText: dataSetText,
      v2RulesTableData: v2RulesTableData.map((rule) => {
        return {
          ...rule,
          active: true,
        };
      }),
      ids,
      typeOfProblem: activeProject.type_of_problem,
      displayType: null,
      selectMultiple: null,
      rulesUuidsToDisplay: null,
    };
  },
);

export const isLoadingV2RulesTableData = createSelector(selectCurrentV2RulesTable, (rulesTable) => {
  if (rulesTable === undefined) return true;
  if (rulesTable.data.length >= 0) {
    return false;
  }
  return true;
});

export const rulestToSave = createSelector(
  selectCurrentV2RulesTableMeta,
  selectCurrentV2RulesTableData,
  selectCurrentV2TabIds,
  (meta, table, ids) => {
    if (!meta || !table || !ids) return undefined;
    return { meta, table, ids };
  },
);

/**
 * Selector to check if any of the rules from currently opened ruleset rule set contains
 * alternatives conditions. It could be used to disable some features for such rulesets.
 */
export const selectIfCurrentRuleSetContainsAlternatives = createSelector(
  selectCurrentV2RulesTable,
  (rulesTable: V2RulesTable | undefined) => (rulesTable ? rulesTable.containsAlternatives : undefined),
);

export const selectCurrentV2RulesTableStatistics = createSelector(selectCurrentV2RulesTable, (rulesTable) => {
  if (rulesTable === undefined) return undefined;
  return rulesTable.statistics;
});
