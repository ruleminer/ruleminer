import { createFeatureSelector, createSelector } from '@ngrx/store';

import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { v2DataSetTableAdapter, v2DataSetTableState } from './v2DataSetTable.reducer';

const { selectEntities } = v2DataSetTableAdapter.getSelectors();

const feature = createFeatureSelector<v2DataSetTableState>('v2DataSetTable');

export const selectDetailsOfRuleSetGenerationEntities = createSelector(feature, selectEntities);

export const selectCurrentv2DataSetTable = createSelector(
  selectDetailsOfRuleSetGenerationEntities,
  selectCurrentV2TabId,
  (entities, currentId) => entities[currentId],
);

export const getCurentV2DataSetTableState = createSelector(
  selectCurrentv2DataSetTable,
  (detailsOfRuleSetGeneration) => {
    if (detailsOfRuleSetGeneration === undefined) return undefined;
    return detailsOfRuleSetGeneration.state;
  },
);

export const getCurrentV2DataSetTableFilterState = createSelector(
  selectCurrentv2DataSetTable,
  (detailsOfRuleSetGeneration) => ({
    filter: detailsOfRuleSetGeneration?.filter,
    sort: detailsOfRuleSetGeneration?.sort,
    totalCount: detailsOfRuleSetGeneration?.totalCount ?? 0,
  }),
);

export const getCurrentV2DataSetTableFilteredCount = createSelector(
  selectCurrentv2DataSetTable,
  (detailsOfRuleSetGeneration) => detailsOfRuleSetGeneration?.filteredCount ?? 0,
);

export const getCurrentV2DataSetTableColumns = createSelector(
  selectCurrentv2DataSetTable,
  (detailsOfRuleSetGeneration) => detailsOfRuleSetGeneration?.columns ?? [],
);


export const getCurrentV2DataSetTableFilterLength = createSelector(
  selectCurrentv2DataSetTable,
  (detailsOfRuleSetGeneration) => (detailsOfRuleSetGeneration?.filter) ? detailsOfRuleSetGeneration.filter.length : null,
);

export const getCurrentV2DataSetTableExportCount = createSelector(
  selectCurrentv2DataSetTable,
  (detailsOfRuleSetGeneration) => detailsOfRuleSetGeneration?.exportCount
);

export const getCurrentV2DataSetTableColumnsWithFilterOperations = createSelector(
  selectCurrentv2DataSetTable,
  (detailsOfRuleSetGeneration) => detailsOfRuleSetGeneration?.columnsWithFilterOperations ?? []
);