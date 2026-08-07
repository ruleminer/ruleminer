import { createReducer, on } from '@ngrx/store';

import { MainLimits } from '../../../main/project/service/models/account.model';
import { AccountUsageLimits } from './limits.action';

const initialState: MainLimits = {
  max_datasets: 0,
  max_projects: 0,
  max_reports: 0,
  max_rulesets: 0,
};

export const LimitReducer = createReducer(
  initialState,
  on(AccountUsageLimits.setLimits, (state, { limits }) => {
    return { ...state, ...limits };
  }),
);
