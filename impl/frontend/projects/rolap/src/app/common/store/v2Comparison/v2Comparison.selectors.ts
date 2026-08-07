import { createSelector } from '@ngrx/store';

import { AppState } from '../app-state.model';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { isLoadingV2RulesTableData } from '../v2RulesTable/v2RulesTable.selectors';
import { v2ComparisonAdapter } from './v2Comparison.reducer';

const { selectEntities } = v2ComparisonAdapter.getSelectors();

export const selectFeature = (state: AppState) => state.v2ComparisonTab;

export const selectComparisonEntities = createSelector(selectFeature, selectEntities);

export const selectCurrentV2Comparison = createSelector(
  selectComparisonEntities,
  selectCurrentV2TabId,
  (entities, currentId) => entities[currentId],
);

export const selectCurrentV2ComparisonForm = createSelector(
  selectCurrentV2Comparison,
  (comparison) => comparison?.formState,
);

export const selectCurrentV2ComparisonFormRelationType = createSelector(
  selectCurrentV2Comparison,
  (comparison) => comparison?.formState.relationType,
);

export const selectCurrentV2ComparisonSecondRuleset = createSelector(
  selectCurrentV2Comparison,
  (comparison) => comparison?.secondRuleset,
);

export const selectComparisonDataToCompare = createSelector(
  selectCurrentV2Comparison,
  (comparison) => comparison?.rulesetDataToCompare,
);

export const selectComparisonMetaToCompare = createSelector(
  selectCurrentV2Comparison,
  (comparison) => comparison?.rulesetMetaToCompare,
);

export const selectComparisonSelectedRowsUUIDs = createSelector(
  selectCurrentV2Comparison,
  (state) => state?.selectedRowsUUIDs || [],
);

export const selectComparisonCalculatedData = createSelector(
  selectCurrentV2Comparison,
  (state) => state?.calculatedData || null,
);

export const selectComparisonShowSomethingChangeWarning = createSelector(
  selectCurrentV2Comparison,
  (state) => state?.showSomethingChangeWarning || false,
);

export const selectComparisonChartData = createSelector(selectCurrentV2Comparison, (state) => state?.chartData || null);

export const isRuleComparisonLoading = createSelector(
  selectCurrentV2Comparison,
  isLoadingV2RulesTableData,
  (comparison, isloadingRules) => {
    if (comparison === undefined && isloadingRules) return true;
    return false;
  },
);
