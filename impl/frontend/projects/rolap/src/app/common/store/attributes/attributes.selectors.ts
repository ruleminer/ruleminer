import { createFeatureSelector, createSelector } from '@ngrx/store';

import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { AttributesState, attributesAdapter } from './attributes.reducer';

export const selectAttributesState = createFeatureSelector<AttributesState>('attributes');

export const { selectAll: selectAllAttributes, selectEntities: selectAttributeEntities } =
  attributesAdapter.getSelectors(selectAttributesState);

export const selectCurrentAttributes = createSelector(
  selectAttributeEntities,
  selectCurrentV2TabId,
  (entities, currentId) => entities[currentId]?.data,
);

export const selectCurrentAttributesMinMaxValues = createSelector(
  selectAttributeEntities,
  selectCurrentV2TabId,
  (entities, currentId) => entities[currentId]?.minMaxValues,
);
