import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';

import { AttributesActions } from './attributes.action';
import { V2Attributes } from './types';

export const attributesAdapter: EntityAdapter<V2Attributes> = createEntityAdapter<V2Attributes>();
export type AttributesState = EntityState<V2Attributes>;

export const initialState: AttributesState = attributesAdapter.getInitialState();

export const attributesReducer = createReducer(
  initialState,
  on(AttributesActions.add, (state, action) => {
    return attributesAdapter.addOne(action.attributes, state);
  }),
  on(AttributesActions.remove, (state, action) => {
    return attributesAdapter.removeOne(action.key, state);
  }),
  on(AttributesActions.removeAll, (state) => {
    return attributesAdapter.removeAll(state);
  }),
);
