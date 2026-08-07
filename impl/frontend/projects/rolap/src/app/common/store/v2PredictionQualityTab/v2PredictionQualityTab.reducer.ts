import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';

import { generateNgrxKey } from '../v2Tabs/utils';
import { V2PredictionQualityTab } from './types';
import { V2PredictionQualityTabActions } from './v2PredictionQualityTab.action';

export const V2PredictionQualityTabAdapter: EntityAdapter<V2PredictionQualityTab> =
  createEntityAdapter<V2PredictionQualityTab>();
export type V2PredictionQualityTabState = EntityState<V2PredictionQualityTab>;

export const initialState: V2PredictionQualityTabState = V2PredictionQualityTabAdapter.getInitialState();

export const V2PredictionQualityTabReducer = createReducer(
  initialState,
  on(V2PredictionQualityTabActions.add, (state, action) => {
    return V2PredictionQualityTabAdapter.addOne(action.prediction, state);
  }),
  on(V2PredictionQualityTabActions.remove, (state, action) => {
    return V2PredictionQualityTabAdapter.removeOne(action.key, state);
  }),
  on(V2PredictionQualityTabActions.removeAll, (state) => {
    return V2PredictionQualityTabAdapter.removeAll(state);
  }),
  on(V2PredictionQualityTabActions.recalculateGeneralIndicators, (state, action) => {
    const { ids, data } = action;
    const key = generateNgrxKey(
      ids.projectId as number,
      ids.dataSetId as number,
      ids.ruleSetId as number,
      0,
      'ruleSet',
    );

    return V2PredictionQualityTabAdapter.updateOne(
      {
        id: key,
        changes: {
          generalIndicators: { general: data },
        },
      },
      { ...state },
    );
  }),
);
