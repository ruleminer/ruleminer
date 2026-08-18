import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { V2Attributes } from './types';

export const AttributesActions = createActionGroup({
  source: 'Attributes Actions',
  events: {
    Add: props<{ attributes: V2Attributes }>(),
    Remove: props<{ key: string }>(),
    'Remove All': emptyProps(),
  },
});
