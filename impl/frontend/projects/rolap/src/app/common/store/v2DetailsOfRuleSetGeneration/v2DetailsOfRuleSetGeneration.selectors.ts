import { createFeatureSelector, createSelector } from '@ngrx/store';

import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import {
  V2DetailsOfRuleSetGenerationState,
  v2DetailsOfRuleSetGenerationAdapter,
} from './v2DetailsOfRuleSetGeneration.reducer';

const { selectEntities } = v2DetailsOfRuleSetGenerationAdapter.getSelectors();

const feature = createFeatureSelector<V2DetailsOfRuleSetGenerationState>('v2DetailsOfRuleSetGeneration');

export const selectDetailsOfRuleSetGenerationEntities = createSelector(feature, selectEntities);

export const selectCurrentV2DetailsOfRuleSetGeneration = createSelector(
  selectDetailsOfRuleSetGenerationEntities,
  selectCurrentV2TabId,
  (entities, currentId) => entities[currentId],
);

export const getCurentTabDescriptionAttributes = createSelector(
  selectCurrentV2DetailsOfRuleSetGeneration,
  (detailsOfRuleSetGeneration) => {
    if (detailsOfRuleSetGeneration === undefined) return undefined;
    return detailsOfRuleSetGeneration.table;
  },
);

export const getCurentTabRulesetPredictionConfig = createSelector(
  selectCurrentV2DetailsOfRuleSetGeneration,
  (detailsOfRuleSetGeneration) => {
    if (detailsOfRuleSetGeneration === undefined) return undefined;
    return detailsOfRuleSetGeneration.table.prediction_config;
  },
);

export const getCurentTabDescriptionAlgoName = createSelector(
  selectCurrentV2DetailsOfRuleSetGeneration,
  (detailsOfRuleSetGeneration) => {
    if (detailsOfRuleSetGeneration === undefined) return undefined;
    return detailsOfRuleSetGeneration.algoName;
  },
);
