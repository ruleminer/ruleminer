import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { environment } from 'projects/rolap/src/environments/environment';

import { FilteringRule, VisibleRule, v2RulesCoverageTab } from './types';
import { sortRuleByNameAscending } from './utils';
import { V2RulesCoverageTabActions } from './v2RulesCoverageTab.actions';

export const V2RulesCoverageTabAdapter: EntityAdapter<v2RulesCoverageTab> = createEntityAdapter<v2RulesCoverageTab>();
export type V2RulesCoverageTabState = EntityState<v2RulesCoverageTab>;

export const initialState: V2RulesCoverageTabState = V2RulesCoverageTabAdapter.getInitialState();

export const v2RulesCoverageTabReducer = createReducer(
  initialState,
  on(V2RulesCoverageTabActions.add, (state, action) => {
    return V2RulesCoverageTabAdapter.addOne(action.coverageTab, state);
  }),
  on(V2RulesCoverageTabActions.remove, (state, action) => {
    return V2RulesCoverageTabAdapter.removeOne(action.key, state);
  }),
  on(V2RulesCoverageTabActions.removeAll, (state) => {
    return V2RulesCoverageTabAdapter.removeAll(state);
  }),

  // Rules visibility reducers
  on(V2RulesCoverageTabActions.addVisibleRule, (state, action) => state),
  on(V2RulesCoverageTabActions.addVisibleRuleComplete, (state, action) => {
    const key = action.currentTabId;
    const tab: v2RulesCoverageTab | undefined = state.entities[key];
    if (!tab) return state;
    const visibleRules: VisibleRule[] = [...tab.visibleRules];
    if (visibleRules.find((r) => r.uuid === action.rule.uuid)) return state;
    // check for maximum number of visible rules
    if (visibleRules.length < environment.coverageMaxRulesVisible) {
      visibleRules.push(action.rule);
    }
    sortRuleByNameAscending(visibleRules);
    return V2RulesCoverageTabAdapter.updateOne({ id: key, changes: { visibleRules: visibleRules } }, state);
  }),
  on(V2RulesCoverageTabActions.removeVisibleRule, (state, action) => state),
  on(V2RulesCoverageTabActions.removeVisibleRuleComplete, (state, action) => {
    const key = action.currentTabId;
    const tab: v2RulesCoverageTab | undefined = state.entities[key];
    if (!tab) return state;
    const visibleRules: VisibleRule[] = tab.visibleRules.filter(
      (visibleRule: VisibleRule) => visibleRule.uuid !== action.rule.uuid,
    );
    sortRuleByNameAscending(visibleRules);
    return V2RulesCoverageTabAdapter.updateOne({ id: key, changes: { visibleRules: visibleRules } }, state);
  }),
  on(V2RulesCoverageTabActions.removeAllVisibleRulesComplete, (state, action) => {
    const key = action.currentTabId;
    const tab: v2RulesCoverageTab | undefined = state.entities[key];
    if (!tab) return state;
    return V2RulesCoverageTabAdapter.updateOne({ id: key, changes: { visibleRules: [] } }, state);
  }),

  // Filtering rules reducers
  on(V2RulesCoverageTabActions.addFilteringRule, (state, action) => state),
  on(V2RulesCoverageTabActions.addFilteringRuleComplete, (state, action) => {
    const key = action.currentTabId;
    const tab: v2RulesCoverageTab | undefined = state.entities[key];
    if (!tab) return state;
    const filteringRules: FilteringRule[] = [...tab.filteringRules];
    if (filteringRules.find((r) => r.uuid === action.rule.uuid)) return state;
    // check for maximum number of filtering rules
    if (filteringRules.length < environment.coverageMaxRulesFiltering) {
      filteringRules.push(action.rule);
    }
    sortRuleByNameAscending(filteringRules);
    return V2RulesCoverageTabAdapter.updateOne({ id: key, changes: { filteringRules: filteringRules } }, state);
  }),
  on(V2RulesCoverageTabActions.removeFilteringRule, (state, action) => state),
  on(V2RulesCoverageTabActions.removeFilteringRuleComplete, (state, action) => {
    const key = action.currentTabId;
    const tab: v2RulesCoverageTab | undefined = state.entities[key];
    if (!tab) return state;
    const filteringRules: FilteringRule[] = tab.filteringRules.filter(
      (filteringRule: FilteringRule) => filteringRule.uuid !== action.rule.uuid,
    );
    return V2RulesCoverageTabAdapter.updateOne({ id: key, changes: { filteringRules: filteringRules } }, state);
  }),
  on(V2RulesCoverageTabActions.removeAllFilteringRulesComplete, (state, action) => {
    const key = action.currentTabId;
    const tab: v2RulesCoverageTab | undefined = state.entities[key];
    if (!tab) return state;
    return V2RulesCoverageTabAdapter.updateOne({ id: key, changes: { filteringRules: [] } }, state);
  }),

  on(V2RulesCoverageTabActions.setRulesFilterOperator, (state, action) => state),
  on(V2RulesCoverageTabActions.setRulesFilterOperatorComplete, (state, action) => {
    const tab: v2RulesCoverageTab | undefined = state.entities[action.currentTabId];
    if (!tab) return state;
    return V2RulesCoverageTabAdapter.updateOne(
      { id: action.currentTabId, changes: { filterOperator: action.filterOperator } },
      state,
    );
  }),

  on(V2RulesCoverageTabActions.updateCoverageDataAfterRulesActivityChange, (state, action) => {
    const tab: v2RulesCoverageTab | undefined = state.entities[action.currentTabId];
    if (!tab) return state;
    const activeRulesUuids: Set<string> = action.activeRulesUuids;
    const filteringRules: FilteringRule[] = tab.filteringRules.filter((r) => activeRulesUuids.has(r.uuid));
    const visibleRules: VisibleRule[] = tab.visibleRules.filter((r) => activeRulesUuids.has(r.uuid));
    return V2RulesCoverageTabAdapter.updateOne(
      { id: action.currentTabId, changes: { filteringRules, visibleRules } },
      state,
    );
  }),

  on(V2RulesCoverageTabActions.updateCoverageDataAfterRulesDeletion, (state, action) => {
    const tab: v2RulesCoverageTab | undefined = state.entities[action.currentTabId];
    if (!tab) return state;
    const rulesUuids: Set<string> = action.rulesUuids;
    const filteringRules: FilteringRule[] = tab.filteringRules.filter((r) => rulesUuids.has(r.uuid));
    const visibleRules: VisibleRule[] = tab.visibleRules.filter((r) => rulesUuids.has(r.uuid));
    return V2RulesCoverageTabAdapter.updateOne(
      { id: action.currentTabId, changes: { filteringRules, visibleRules } },
      state,
    );
  }),

  on(V2RulesCoverageTabActions.toggleIsUniqueCoverage, (state) => state),
  on(V2RulesCoverageTabActions.toggleIsUniqueCoverageComplete, (state, action) => {
    const tab: v2RulesCoverageTab | undefined = state.entities[action.currentTabId];
    if (!tab) return state;
    return V2RulesCoverageTabAdapter.updateOne(
      { id: action.currentTabId, changes: { isUniqueCoverage: !tab.isUniqueCoverage } },
      state,
    );
  }),

  on(V2RulesCoverageTabActions.setUniqueCoverage, (state) => state),
  on(V2RulesCoverageTabActions.setUniqueCoverageComplete, (state, action) => {
    const tab: v2RulesCoverageTab | undefined = state.entities[action.currentTabId];
    if (!tab) return state;
    return V2RulesCoverageTabAdapter.updateOne(
      {
        id: action.currentTabId,
        changes: {
          uniqueExamples: action.uniqueCoverage,
        },
      },
      state,
    );
  }),
);
