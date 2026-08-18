import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { GeneralIndicators } from '../app-state.model';
import { Ids } from '../ruleSets/rulesets.selectors';
import { V2PredictionQualityTab } from './types';

export const V2PredictionQualityTabActions = createActionGroup({
  source: 'V2 PredictionQualityTab Actions',
  events: {
    Add: props<{ prediction: V2PredictionQualityTab }>(),
    RecalculateGeneralIndicators: props<{ data: GeneralIndicators; ids: Ids }>(), //TODO: Use ngRxKey after refresh migration
    Remove: props<{ key: string }>(),
    'Remove All': emptyProps(),
  },
});
