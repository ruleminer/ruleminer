import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { MainLimits } from '../../../main/project/service/models/account.model';

export const AccountUsageLimits = createActionGroup({
  source: 'Account Limits',
  events: {
    'Load Limits': emptyProps(),
    'Set Limits': props<{ limits: MainLimits }>(),
  },
});
