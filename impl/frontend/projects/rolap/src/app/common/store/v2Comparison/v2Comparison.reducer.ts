import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';

import { V2Comparison } from './types';
import { V2ComparisonActions } from './v2Comparison.action';

export const v2ComparisonAdapter: EntityAdapter<V2Comparison> = createEntityAdapter<V2Comparison>();
export type V2ComparisonState = EntityState<V2Comparison>;

export const initialState: V2ComparisonState = v2ComparisonAdapter.getInitialState();

export const v2ComparisonReducer = createReducer(
  initialState,
  on(V2ComparisonActions.add, (state, action) => {
    return v2ComparisonAdapter.addOne(action.comparison, state);
  }),
  on(V2ComparisonActions.remove, (state, action) => {
    return v2ComparisonAdapter.removeOne(action.key, state);
  }),
  on(V2ComparisonActions.removeAll, (state) => {
    return v2ComparisonAdapter.removeAll(state);
  }),

  on(V2ComparisonActions.saveFormState, (state) => state),
  on(V2ComparisonActions.saveFormStateComplete, (state, action) => {
    return v2ComparisonAdapter.updateOne(
      {
        id: action.key,
        changes: {
          formState: action.formState,
        },
      },
      state,
    );
  }),

  on(V2ComparisonActions.setSecondRuleset, (state) => state),
  on(V2ComparisonActions.setSecondRulesetComplete, (state, action) => {
    return v2ComparisonAdapter.updateOne(
      {
        id: action.key,
        changes: {
          secondRuleset: action.secondRuleset,
        },
      },
      state,
    );
  }),
  on(V2ComparisonActions.setRulesetDataToCompare, (state) => state),
  on(V2ComparisonActions.setRulesetDataToCompareComplete, (state, action) => {
    return v2ComparisonAdapter.updateOne(
      {
        id: action.key,
        changes: {
          rulesetDataToCompare: action.rulesetDataToCompare,
        },
      },
      state,
    );
  }),
  on(V2ComparisonActions.setRulesetMetaToCompare, (state) => state),
  on(V2ComparisonActions.setRulesetMetaToCompareComplete, (state, action) => {
    return v2ComparisonAdapter.updateOne(
      {
        id: action.key,
        changes: {
          rulesetMetaToCompare: action.rulesetMetaToCompare,
        },
      },
      state,
    );
  }),
  on(V2ComparisonActions.setSelectedRows, (state) => state),
  on(V2ComparisonActions.setSelectedRowsComplete, (state, action) => {
    return v2ComparisonAdapter.updateOne(
      {
        id: action.key,
        changes: {
          selectedRowsUUIDs: action.selectedRowsUUIDs,
        },
      },
      state,
    );
  }),

  on(V2ComparisonActions.toggleSelectedRow, (state, action) => state),
  on(V2ComparisonActions.toggleSelectedRowComplete, (state, action) => {
    const comparison = state.entities[action.key];
    if (!comparison) return state;

    const selectedRowsUUIDs = comparison.selectedRowsUUIDs.includes(action.uuid)
      ? comparison.selectedRowsUUIDs.filter((row) => row !== action.uuid)
      : [...comparison.selectedRowsUUIDs, action.uuid];

    return v2ComparisonAdapter.updateOne(
      {
        id: action.key,
        changes: {
          selectedRowsUUIDs,
        },
      },
      state,
    );
  }),
  on(V2ComparisonActions.setShowSomethingChangeWarning, (state) => state),
  on(V2ComparisonActions.setShowSomethingChangeWarningComplete, (state, action) => {
    return v2ComparisonAdapter.updateOne(
      {
        id: action.key,
        changes: {
          showSomethingChangeWarning: action.value,
        },
      },
      state,
    );
  }),
  on(V2ComparisonActions.setCalculatedData, (state) => state),
  on(V2ComparisonActions.setCalculatedDataComplete, (state, action) => {
    return v2ComparisonAdapter.updateOne(
      {
        id: action.key,
        changes: {
          calculatedData: action.data,
        },
      },
      state,
    );
  }),
  on(V2ComparisonActions.setChartData, (state) => state),
  on(V2ComparisonActions.setChartDataComplete, (state, action) => {
    return v2ComparisonAdapter.updateOne(
      {
        id: action.key,
        changes: {
          chartData: action.data,
        },
      },
      state,
    );
  }),
);
