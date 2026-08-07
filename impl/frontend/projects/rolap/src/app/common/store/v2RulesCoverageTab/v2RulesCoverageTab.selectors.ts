import { createFeatureSelector, createSelector } from '@ngrx/store';

import { convertRulesBigTableForBackend, getActiveRows } from '../../../main/data-upload/utils/utils';
import { Project } from '../../../main/project/models/project';
import { AppState } from '../app-state.model';
import { Ids } from '../ruleSets/rulesets.selectors';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { V2RulesTableData, V2RulesTableMeta } from '../v2RulesTable/types';
import {
  selectCurrentV2RulesTableData,
  selectCurrentV2RulesTableMeta,
  selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered,
} from '../v2RulesTable/v2RulesTable.selectors';
import { selectCurrentV2TabIds } from '../v2Tabs/v2Tabs.selectors';
import { FilterOperators, FilteringRule, RulesCoverageTableStoreData, VisibleRule, v2RulesCoverageTab } from './types';
import { filterOnlyActiveRules } from './utils';
import { V2RulesCoverageTabAdapter, V2RulesCoverageTabState } from './v2RulesCoverageTab.reducer';

const { selectEntities } = V2RulesCoverageTabAdapter.getSelectors();

export const selectFeature = (state: AppState) => state.v2RulesCoverageTab;

const feature = createFeatureSelector<V2RulesCoverageTabState>('v2RulesCoverageTab');

export const selectPredictionTabEntities = createSelector(feature, selectEntities);

export const selectCurrentV2CoverageTab = createSelector(
  selectPredictionTabEntities,
  selectCurrentV2TabId,
  (entities, currentId) => entities[currentId],
);

export const getCurrentTabVisibleRules = createSelector(selectCurrentV2CoverageTab, (coverageTab) => {
  if (coverageTab === undefined) return null;
  return coverageTab.visibleRules;
});

export const getCurrentTabFilteringRules = createSelector(selectCurrentV2CoverageTab, (coverageTab) => {
  if (coverageTab === undefined) return null;
  return coverageTab.filteringRules;
});

export const getCurrentTabFilteringAndVisbileRules = createSelector(selectCurrentV2CoverageTab, (coverageTab) => {
  if (coverageTab === undefined) return null;
  return { filteringRules: coverageTab.filteringRules, visibleRules: coverageTab.visibleRules };
});

export const getCurrentTabRulesFilterOperator = createSelector(
  selectCurrentV2CoverageTab,
  (currentTab: v2RulesCoverageTab | undefined): FilterOperators | null => {
    if (!currentTab || !currentTab) return null;
    return currentTab.filterOperator;
  },
);

const coverageTableDataSelectorHandler = (
  project: Project | undefined,
  ids: Ids | undefined,
  rulesTableData: V2RulesTableData | undefined,
  ruleSetMeta: V2RulesTableMeta | undefined,
  activeRowsUuidsArray: string[] | null,
  coverageTab?: v2RulesCoverageTab | undefined,
  getCurentTabRulesetPredictionConfig?: any,
): RulesCoverageTableStoreData | null => {
  if (
    rulesTableData === undefined ||
    ids === undefined ||
    project === undefined ||
    ruleSetMeta === undefined ||
    activeRowsUuidsArray === null
  ) {
    return null;
  }
  const activesRulesUuids: Set<string> = new Set(activeRowsUuidsArray);

  const newVisibleRules: VisibleRule[] = filterOnlyActiveRules(activesRulesUuids, coverageTab?.visibleRules ?? []);
  const newRulesFilter: FilteringRule[] = filterOnlyActiveRules(activesRulesUuids, coverageTab?.filteringRules ?? []);
  const activeRules = getActiveRows(rulesTableData, activeRowsUuidsArray);
  return {
    ids: ids,
    projectProblemType: project.type_of_problem,
    ruleset: {
      meta: ruleSetMeta,
      rules: convertRulesBigTableForBackend(activeRules),
    },
    newRulesFilter,
    newVisibleRules,
  };
};

/**
 * Select all required data from store for coverage table component displaying
 * rules coverage data and predictions.
 */
export const selectCoverageTableDataWithCoverageData = createSelector(
  (state: AppState) => state.project.activeProject,
  selectCurrentV2TabIds,
  selectCurrentV2RulesTableData,
  selectCurrentV2RulesTableMeta,
  selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered,
  selectCurrentV2CoverageTab,
  coverageTableDataSelectorHandler,
);

/**
 * Select all required data from store for coverage table component displaying
 * only predictions (no rules coverage data).
 */
export const selectCoverageTableDataWithoutCoverageData = createSelector(
  (state: AppState) => state.project.activeProject,
  selectCurrentV2TabIds,
  selectCurrentV2RulesTableData,
  selectCurrentV2RulesTableMeta,
  selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered,
  coverageTableDataSelectorHandler,
);

/**
 * Select is unique coverage
 */
export const selectIsUniqueCoverage = createSelector(selectCurrentV2CoverageTab, (coverageTab) => {
  if (coverageTab === undefined) return null;
  return coverageTab.isUniqueCoverage;
});

export const selectUniqueCoverage = createSelector(selectCurrentV2CoverageTab, (coverageTab) => {
  if (coverageTab === undefined) return null;
  return coverageTab.uniqueExamples;
});
