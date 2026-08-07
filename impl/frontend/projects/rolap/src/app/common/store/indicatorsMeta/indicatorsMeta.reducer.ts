import { createReducer, on } from '@ngrx/store';

import { Description } from '../../components/tooltip/tooltip.component';
import { IndicatorsMetaActions } from './indicatorsMeta.actions';
import { IndicatorKey, IndicatorMeta, IndicatorsMetaState } from './types';

const initialState: IndicatorsMetaState = {
  indicatorsHigherIsBetterFlags: {},
  indicatorsDescriptions: {},
};

export const indicatorsMetaReducer = createReducer(
  initialState,
  on(IndicatorsMetaActions.setIndicatorsMetadata, (state, { problemType, indicatorsMeta }) => {
    const indicatorsHigherIsBetterFlags: Record<IndicatorKey, boolean> = {};
    const indicatorsDescriptions: Record<IndicatorKey, Description> = {};

    indicatorsMeta.forEach((metadata: IndicatorMeta) => {
      indicatorsDescriptions[metadata.key] = {
        description_pl: metadata.description_pl,
        description_en: metadata.description_en,
      };
      indicatorsHigherIsBetterFlags[metadata.key] = metadata.higher_is_better;
    });
    return {
      problemType,
      indicatorsHigherIsBetterFlags,
      indicatorsDescriptions,
    };
  }),
);
