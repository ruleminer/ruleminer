import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';

import { V2DetailsOfRuleSetGeneration } from './types';
import { V2DetailsOfRuleSetGenerationActions } from './v2DetailsOfRuleSetGeneration.action';

export const v2DetailsOfRuleSetGenerationAdapter: EntityAdapter<V2DetailsOfRuleSetGeneration> =
  createEntityAdapter<V2DetailsOfRuleSetGeneration>();
export type V2DetailsOfRuleSetGenerationState = EntityState<V2DetailsOfRuleSetGeneration>;

export const initialState: V2DetailsOfRuleSetGenerationState = v2DetailsOfRuleSetGenerationAdapter.getInitialState();

export const v2DetailsOfRuleSetGenerationReducer = createReducer(
  initialState,
  on(V2DetailsOfRuleSetGenerationActions.add, (state, action) => {
    return v2DetailsOfRuleSetGenerationAdapter.addOne(action.details, state);
  }),
  on(V2DetailsOfRuleSetGenerationActions.remove, (state, action) => {
    return v2DetailsOfRuleSetGenerationAdapter.removeOne(action.key, state);
  }),
  on(V2DetailsOfRuleSetGenerationActions.removeAll, (state) => {
    return v2DetailsOfRuleSetGenerationAdapter.removeAll(state);
  }),
  on(V2DetailsOfRuleSetGenerationActions.setPredictionConfig, (state, action) => state),
  on(V2DetailsOfRuleSetGenerationActions.setPreditionConfigComplete, (state, action) => {
    const entity = state.entities[action.key];
    if (!entity) {
      return state;
    }
    return v2DetailsOfRuleSetGenerationAdapter.updateOne(
      {
        id: action.key,
        changes: {
          table: {
            ...entity.table,
            prediction_config: action.predictionConfig,
          },
        },
      },
      state,
    );
  }),
);
