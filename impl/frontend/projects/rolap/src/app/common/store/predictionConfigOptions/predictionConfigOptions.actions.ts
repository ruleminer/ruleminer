import { createActionGroup, props } from '@ngrx/store';

import { PredictionConfigOptions } from './types';

export const PredictionConfigOptionsActions = createActionGroup({
  source: 'Prediction Config Options',
  events: {
    'Set Options': props<{ options: PredictionConfigOptions }>(),
  },
});
