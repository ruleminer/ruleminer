import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { V2StatisticsTab } from './types';

export const V2StatisticsTabActions = createActionGroup({
  source: 'V2 StatisticsTab Actions',
  events: {
    Add: props<{ statistics: V2StatisticsTab }>(),
    Remove: props<{ key: string }>(),
    'Remove All': emptyProps(),
  },
});
