import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';

import { V2StatisticsTab } from './types';
import { V2StatisticsTabActions } from './v2StatisticsTab.action';

export const v2StatisticsTabAdaper: EntityAdapter<V2StatisticsTab> = createEntityAdapter<V2StatisticsTab>();
export type V2StatisticsTabState = EntityState<V2StatisticsTab>;

const initialState: V2StatisticsTabState = v2StatisticsTabAdaper.getInitialState();

export const v2StatisticsTabReducer = createReducer(
  initialState,
  on(V2StatisticsTabActions.add, (state, action) => {
    return v2StatisticsTabAdaper.addOne(action.statistics, state);
  }),
  on(V2StatisticsTabActions.remove, (state, action) => {
    return v2StatisticsTabAdaper.removeOne(action.key, state);
  }),
  on(V2StatisticsTabActions.removeAll, (state) => {
    return v2StatisticsTabAdaper.removeAll(state);
  }),
);
