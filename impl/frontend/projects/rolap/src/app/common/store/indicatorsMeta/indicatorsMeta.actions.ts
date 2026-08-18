import { createActionGroup, props } from '@ngrx/store';

import { IndicatorMeta } from './types';
import { ProblemTypes } from '../../../main/data-upload/utils/enums';

export const IndicatorsMetaActions = createActionGroup({
  source: 'Indicators metadata',
  events: {
    'Set indicators metadata': props<{ problemType: ProblemTypes, indicatorsMeta: IndicatorMeta[] }>(),
  },
});
