import { createSelector } from '@ngrx/store';

import { AppState } from '../app-state.model';

/**
 * Selects a map where keys are indicator keys and values are boolean flags indicating
 * whether indicator is better if its values are higher. For example for Accuracy
 * this flag is set to true, while for Mean Absolute Error it is false.
 */
export const selectIndicatorsHigherIsBetterFlags = createSelector(
  (state: AppState) => state.indicatorsMeta,
  (indicatorsMetaState) => indicatorsMetaState.indicatorsHigherIsBetterFlags,
);

/**
 * Selects indicators descriptions.
 */
export const selectIndicatorsDescriptions = createSelector(
  (state: AppState) => state.indicatorsMeta,
  (indicatorsMetaState) => indicatorsMetaState.indicatorsDescriptions,
);
