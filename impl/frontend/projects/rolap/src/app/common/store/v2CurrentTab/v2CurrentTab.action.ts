import { createActionGroup, props } from '@ngrx/store';

export const V2CurrentTabAction = createActionGroup({
  source: 'V2 Current Tab Actions',
  events: {
    'Set Current Tab': props<{ currentTab: string }>(),
  },
});
