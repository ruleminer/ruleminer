import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';

import { V2PredictionTab } from './types';
import { V2PredictionTabActions } from './v2PredictionTab.action';

export const V2PredictionTabAdapter: EntityAdapter<V2PredictionTab> = createEntityAdapter<V2PredictionTab>();

export type V2PredictionTabState = EntityState<V2PredictionTab>;

export const initialState: V2PredictionTabState = V2PredictionTabAdapter.getInitialState();

export const V2PredictionTabReducer = createReducer(
  initialState,
  on(V2PredictionTabActions.set, (state, action) => {
    return state;
  }),
  on(V2PredictionTabActions.setComplete, (state, action) => {
    return V2PredictionTabAdapter.setOne(
      {
        id: action.currentTabId,
        selectedDatasetId: action.selectedDatasetId,
        visibleDatasetId: action.selectedDatasetId,
      },
      state,
    );
  }),
  on(V2PredictionTabActions.updateSelectedDatasetID, (state, action) => {
    return state;
  }),

  on(V2PredictionTabActions.updateSelectedDatasetIDComplete, (state, action) => {
    return V2PredictionTabAdapter.updateOne(
      { id: action.currentTabId, changes: { selectedDatasetId: action.selectedDatasetId } },
      state,
    );
  }),

  on(V2PredictionTabActions.setVisibleDataset, (state, action) => {
    return state;
  }),
  on(V2PredictionTabActions.setVisibleDatasetComplete, (state, action) => {
    return V2PredictionTabAdapter.updateOne(
      { id: action.currentTabId, changes: { visibleDatasetId: action.selectedDatasetId } },
      state,
    );
  }),
  on(V2PredictionTabActions.remove, (state, action) => {
    return V2PredictionTabAdapter.removeOne(action.currentTabId, state);
  }),
  on(V2PredictionTabActions.removeAll, (state) => {
    return V2PredictionTabAdapter.removeAll(state);
  }),
);
