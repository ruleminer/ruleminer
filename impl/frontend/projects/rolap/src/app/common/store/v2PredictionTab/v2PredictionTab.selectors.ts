import { createSelector } from '@ngrx/store';

import { AppState } from '../app-state.model';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { V2PredictionTabAdapter } from './v2PredictionTab.reducer';

const { selectIds, selectEntities, selectAll, selectTotal } = V2PredictionTabAdapter.getSelectors();

export const selectFeature = (state: AppState) => state.v2PredictionTab;

export const selectV2PredictionTab = createSelector(selectFeature, selectIds);
export const selectV2PredictionTabEntities = createSelector(selectFeature, selectEntities);

export const selectCurrentV2PredictionTab = createSelector(
  selectV2PredictionTabEntities,
  selectCurrentV2TabId,
  (entities, currentId) => entities[currentId],
);

export const selectV2PredictionSelectedDatasetId = createSelector(
  selectCurrentV2PredictionTab,
  (currentTab) => currentTab?.selectedDatasetId,
);

export const selectV2PredictionVisibleDatasetId = createSelector(
  selectCurrentV2PredictionTab,
  (currentTab) => currentTab?.visibleDatasetId,
);

export const selectV2PredictionIsOutdated = createSelector(selectCurrentV2PredictionTab, (currentTab) => {
  if (!currentTab) return false;
  const { selectedDatasetId, visibleDatasetId } = currentTab;
  if (!selectedDatasetId || !visibleDatasetId) return false;

  return selectedDatasetId !== visibleDatasetId;
});
