import { createFeatureSelector, createSelector } from '@ngrx/store';

import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { V2StatisticsTabState, v2StatisticsTabAdaper } from './v2StatisticsTab.reducer';

const { selectEntities } = v2StatisticsTabAdaper.getSelectors();

const feature = createFeatureSelector<V2StatisticsTabState>('v2StatisticsTab');

export const selectPredictionTabEntities = createSelector(feature, selectEntities);

export const selectStatisticsTabEntities = createSelector(feature, selectEntities);

export const selectCurrentStatisticsTab = createSelector(
  selectStatisticsTabEntities,
  selectCurrentV2TabId,
  (entities, currentId) => entities[currentId],
);

export const selectCurrentV2StatisticsTabUnimportantAttributes = createSelector(
  selectCurrentStatisticsTab,
  (statisticsTab) => {
    if (statisticsTab === undefined) return undefined;
    return statisticsTab.unimportantAttributes;
  },
);
