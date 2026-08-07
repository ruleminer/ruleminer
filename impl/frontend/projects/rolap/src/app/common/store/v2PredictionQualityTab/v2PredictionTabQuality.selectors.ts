import { createFeatureSelector, createSelector } from '@ngrx/store';

import { AppState } from '../app-state.model';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { V2PredictionQualityTabAdapter, V2PredictionQualityTabState } from './v2PredictionQualityTab.reducer';

const { selectIds, selectEntities, selectAll, selectTotal } = V2PredictionQualityTabAdapter.getSelectors();

export const selectFeature = (state: AppState) => state.v2PredictionQualityTab;

export const selectV2ClassifyIds = createSelector(selectFeature, selectIds);
export const selectV2ClassifyEntities = createSelector(selectFeature, selectEntities);
export const selectAllV2Classify = createSelector(selectFeature, selectAll);
export const selectV2ClassifyTotal = createSelector(selectFeature, selectTotal);

const feature = createFeatureSelector<V2PredictionQualityTabState>('v2PredictionQualityTab');

export const selectPredictionTabEntities = createSelector(feature, selectEntities);

export const selectCurrentV2PredictionQualityTab = createSelector(
  selectPredictionTabEntities,
  selectCurrentV2TabId,
  (entities, currentId) => entities[currentId],
);

export const selectCurrentV2PredictionQualityTabHistogram = createSelector(
  selectCurrentV2PredictionQualityTab,
  (predictionTab) => {
    if (predictionTab === undefined) return undefined;
    return predictionTab.histogram;
  },
);

export const selectCurrentV2PredictionQualityTabCrossValidation = createSelector(
  selectCurrentV2PredictionQualityTab,
  (predictionTab) => {
    if (predictionTab === undefined) return undefined;
    return predictionTab.crossValidation;
  },
);

export const selectCurrentV2PredictionQualityTabGeneralIndicators = createSelector(
  selectCurrentV2PredictionQualityTab,
  (predictionTab) => {
    if (predictionTab === undefined) return undefined;
    return predictionTab.generalIndicators;
  },
);

export const isLoadingCurrentV2PredictionQualityTab = createSelector(
  selectCurrentV2PredictionQualityTab,
  (predictionTab) => {
    if (!predictionTab?.generalIndicators) return true;
    return false;
  },
);
