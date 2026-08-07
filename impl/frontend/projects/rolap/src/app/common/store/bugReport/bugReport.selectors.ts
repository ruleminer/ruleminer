import { createSelector } from '@ngrx/store';

import { AppState } from '../app-state.model';

export const bugReportStateSelector = createSelector(
  (state: AppState) => state.bugReport,
  (bugReport) => bugReport,
);
