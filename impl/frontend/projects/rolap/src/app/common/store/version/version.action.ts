import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const StoreVersionActions = createActionGroup({
  source: 'StoreVersion Actions',
  events: {
    'Set store version': props<{ version: number }>(),
    'Set store version Complete': props<{ version: number }>(),
    'Open modal and clear tabs': emptyProps(),
  },
});
