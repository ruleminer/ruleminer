import { createSelector } from '@ngrx/store';

import { AppState } from '../app-state.model';

export const mainLimitsSelector = createSelector(
  (state: AppState) => state.limits,
  (limits) => ({
    max_projects: limits?.max_projects,
    max_rulesets: limits?.max_rulesets,
    max_datasets: limits?.max_datasets,
    max_reports: limits?.max_reports,
  }),
);
