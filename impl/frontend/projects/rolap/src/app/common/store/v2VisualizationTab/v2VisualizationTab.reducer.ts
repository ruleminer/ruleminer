import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';

import { V2VisualizationTab, selectedRuleV2VisualizationTab } from './types';
import { V2VisualizationTabActions } from './v2VisualizationTab.action';

export const v2visualizationTabAdapter: EntityAdapter<V2VisualizationTab> = createEntityAdapter<V2VisualizationTab>();
export type V2VisualizationTabState = EntityState<V2VisualizationTab>;

export const initialState: V2VisualizationTabState = v2visualizationTabAdapter.getInitialState();

export const v2VisualizationTabReducer = createReducer(
  initialState,
  on(V2VisualizationTabActions.add, (state, action) => {
    return v2visualizationTabAdapter.addOne(action.visualizationTab, state);
  }),
  on(V2VisualizationTabActions.remove, (state, action) => {
    return v2visualizationTabAdapter.removeOne(action.key, state);
  }),
  on(V2VisualizationTabActions.removeAll, (state) => {
    return v2visualizationTabAdapter.removeAll(state);
  }),
  on(V2VisualizationTabActions.toggleRule, (state) => state),
  on(V2VisualizationTabActions.toggleRuleComplete, (state, action) => {
    const currentRules = state.entities[action.key]?.selectedRules || [];
    const ruleIndex = currentRules.findIndex((rule) => rule.ruleUUid === action.selectedRule.ruleUUid);

    let updatedRules: selectedRuleV2VisualizationTab[];

    if (action.selectedRule.selectedSubconditionIndexes.length === 0) {
      // Remove the rule if the selectedSubconditionIndexes is empty
      updatedRules = currentRules.filter((rule) => rule.ruleUUid !== action.selectedRule.ruleUUid);
    } else {
      if (ruleIndex !== -1) {
        // Update the rule with the new selectedSubconditionIndexes
        updatedRules = currentRules.map((rule) =>
          rule.ruleUUid === action.selectedRule.ruleUUid ? action.selectedRule : rule,
        );
      } else {
        // Add the rule if it doesn't exist
        updatedRules = [...currentRules, action.selectedRule];
      }
    }

    const showSomeRulesWereUnselectedInfo = !action.isUserAction;

    return v2visualizationTabAdapter.updateOne(
      {
        id: action.key,
        changes: {
          selectedRules: updatedRules,
          showSomeRulesWereUnselectedInfo,
        },
      },
      state,
    );
  }),
  on(V2VisualizationTabActions.setSearchValue, (state) => state),
  on(V2VisualizationTabActions.setSearchValueComplete, (state, action) => {
    return v2visualizationTabAdapter.updateOne(
      {
        id: action.key,
        changes: { searchValue: action.searchValue },
      },
      state,
    );
  }),
  on(V2VisualizationTabActions.toggleHiddenRulesUUID, (state) => state),
  on(V2VisualizationTabActions.toggleHiddenRulesUUIDComplete, (state, action) => {
    const currentHiddenRulesUUIDs = state.entities[action.key]?.hiddenRulesUUIDs || [];
    const hiddenRulesUUIDs = currentHiddenRulesUUIDs.includes(action.hiddenRulesUUID)
      ? currentHiddenRulesUUIDs.filter((uuid) => uuid !== action.hiddenRulesUUID)
      : [...currentHiddenRulesUUIDs, action.hiddenRulesUUID];

    return v2visualizationTabAdapter.updateOne(
      {
        id: action.key,
        changes: { hiddenRulesUUIDs },
      },
      state,
    );
  }),
  on(V2VisualizationTabActions.setRulesAndClearSearch, (state) => state),
  on(V2VisualizationTabActions.setRulesAndClearSearchComplete, (state, action) => {
    return v2visualizationTabAdapter.updateOne(
      {
        id: action.key,
        changes: {
          selectedRules: action.selectedRules,
          searchValue: '',
        },
      },
      state,
    );
  }),
  on(V2VisualizationTabActions.unselectRule, (state) => state),
  on(V2VisualizationTabActions.unselectRuleComplete, (state, action) => {
    const currentRules = state.entities[action.key]?.selectedRules || [];
    const updatedRules = currentRules.filter((rule) => rule.ruleUUid !== action.rowUuid);
    return v2visualizationTabAdapter.updateOne(
      {
        id: action.key,
        changes: {
          selectedRules: updatedRules,
        },
      },
      state,
    );
  }),
  on(V2VisualizationTabActions.setShowRulesWereUnselectedInfo, (state) => state),
  on(V2VisualizationTabActions.setShowRulesWereUnselectedInfoComplete, (state, action) => {
    return v2visualizationTabAdapter.updateOne(
      {
        id: action.key,
        changes: { showSomeRulesWereUnselectedInfo: action.showSomeRulesWereUnselectedInfo },
      },
      state,
    );
  }),
  on(V2VisualizationTabActions.setSelectedGraphNodes, (state) => state),
  on(V2VisualizationTabActions.setSelectedGraphNodesComplete, (state, action) => {
    return v2visualizationTabAdapter.updateOne(
      {
        id: action.key,
        changes: { selectedGraphNodes: action.selectedGraphNodes },
      },
      state,
    );
  }),
);
