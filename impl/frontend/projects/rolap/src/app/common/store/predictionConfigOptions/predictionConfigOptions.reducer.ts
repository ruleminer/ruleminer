import { createReducer, on } from '@ngrx/store';

import { PredictionConfigOptionsActions } from './predictionConfigOptions.actions';
import { PredictionConfigOptionsState } from './types';

const initialState: PredictionConfigOptionsState = {
  options: null,
};

export const predictionConfigOptionsReducer = createReducer(
  initialState,
  on(PredictionConfigOptionsActions.setOptions, (state, { options }) => {
    return { ...state, options: options };
  }),
);
