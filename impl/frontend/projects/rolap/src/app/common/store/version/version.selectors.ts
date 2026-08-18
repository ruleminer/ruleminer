import { createSelector } from '@ngrx/store';

import { AppState, StoreVersion } from '../app-state.model';

export const storeVersionNumberSelector = createSelector(
  (state: AppState) => state.version,
  (version: StoreVersion) => version.version,
);
