import { createReducer, createSelector, on } from '@ngrx/store';

import { AppState, LabelsState } from '../app-state.model';
import { toggleCompactState } from './labels.action';

const initialState: LabelsState = {
  compacted: false,
};

export const labelsReducer = createReducer(
  initialState,
  on(toggleCompactState, (state) => ({
    ...state,
    compacted: !state.compacted,
  })),
);

export const labelsCompactedSelector = createSelector(
  (state: AppState) => state.labels,
  (label: LabelsState) => label.compacted,
);
