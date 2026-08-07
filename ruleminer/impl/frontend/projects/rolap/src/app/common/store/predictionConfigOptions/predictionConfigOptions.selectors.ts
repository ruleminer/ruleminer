import { createSelector } from '@ngrx/store';

import { AppState } from '../app-state.model';
import { PredictionConfigOptionsState } from './types';

/**
 * Selects the prediction config options for current project.
 * Data from this selector could be used to populate prediction
 * configurations forms with possible options for user to choose from.
 */
export const selectPredictionConfigOptions = createSelector(
  (state: AppState) => state.predictionConfigOptions,
  (state: PredictionConfigOptionsState) => state.options,
);
