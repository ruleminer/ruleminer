import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { CurrentPosition } from './types';

export const TourActions = createActionGroup({
  source: 'Tour Actions',
  events: {
    'Stop Tour': emptyProps(),
    'Start Tour': emptyProps(),
    'Next Step': emptyProps(),
    'Prev Step': emptyProps(),
    'Set Current Position': props<{ stepIndex: number }>(),
    'Set Current Position Complete': props<{ currentPosition: CurrentPosition }>(),
    'Set Step Ready': props<{ isStepReady: boolean }>(),
    'Next step complete': props<{ currentStepIndex: number }>(),
    'Prev step complete': props<{ currentStepIndex: number }>(),
    'Set Current Route': props<{ route: string }>(),
    'Last step': emptyProps(),
    'Complete Tour': emptyProps(),
    'Exit Tour': emptyProps(),
  },
});
