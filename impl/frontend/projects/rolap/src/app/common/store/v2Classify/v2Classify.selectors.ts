import { createFeatureSelector, createSelector } from '@ngrx/store';

import { AppState } from '../app-state.model';
import { activeProjectSelector } from '../project/project.selectors';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { selectProjectRulesTableData } from '../v2RulesTable/v2RulesTable.selectors';
import { V2ClassifyState, v2ClassifyAdapter, v2ClassifyCardAdapter } from './v2Classify.reducer';

const { selectIds, selectEntities, selectAll, selectTotal } = v2ClassifyAdapter.getSelectors();

export const selectFeature = (state: AppState) => state.v2Classify;

export const selectV2ClassifyIds = createSelector(selectFeature, selectIds);
export const selectV2ClassifyEntities = createSelector(selectFeature, selectEntities);
export const selectAllV2Classify = createSelector(selectFeature, selectAll);
export const selectV2ClassifyTotal = createSelector(selectFeature, selectTotal);

const feature = createFeatureSelector<V2ClassifyState>('v2Classify');

export const selectClassifyEntities = createSelector(feature, selectEntities);

export const selectCurrentV2Classify = createSelector(
  selectClassifyEntities,
  selectCurrentV2TabId,
  (entities, currentId) => entities[currentId],
);

export const selectCurrentV2ClassifyCards = createSelector(selectCurrentV2Classify, (classify) => {
  if (classify === undefined) return undefined;
  return v2ClassifyCardAdapter.getSelectors().selectAll(classify.cards as any);
});

export const selectProjectExampleResults = createSelector(
  selectCurrentV2ClassifyCards,
  activeProjectSelector,
  selectProjectRulesTableData,
  (classifyCards, project, projectRulesTableData) => {
    if (!classifyCards || !project || !projectRulesTableData) return undefined;
    return {
      classifyCards,
      project,
      projectRulesTableData,
    };
  },
);

export const selectClassifyAndFirstTimeLoading = createSelector(selectCurrentV2Classify, (classify) => {
  if (!classify) {
    return {
      cards: [],
      isLoading: true,
    };
  }

  const cards = v2ClassifyCardAdapter.getSelectors().selectAll(classify.cards as any);

  const isLoading = cards.every((card) => {
    const exampleTable = card.exampleTable;
    return !exampleTable || exampleTable.length === 0;
  });

  return {
    cards,
    isLoading,
  };
});

export const selectClassifyCardsIds = createSelector(selectCurrentV2Classify, (classify) => {
  if (!classify) return [];
  return v2ClassifyCardAdapter
    .getSelectors()
    .selectIds(classify.cards)
    .map((id) => id.toString());
});

export const selectClassifyCardsForColumns = createSelector(selectCurrentV2Classify, (classify) => {
  if (!classify) return [];
  return v2ClassifyCardAdapter
    .getSelectors()
    .selectAll(classify.cards)
    .map((card) => card.exampleTable[0]);
});

export const selectShowClassifyCardCloseBtn = createSelector(selectClassifyCardsIds, (ids) => {
  if (!ids) return false;
  return ids.length > 1;
});
