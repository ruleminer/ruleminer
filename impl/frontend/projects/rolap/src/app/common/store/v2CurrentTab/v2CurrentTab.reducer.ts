import { createReducer, on } from '@ngrx/store';

import { V2CurrentTabAction } from './v2CurrentTab.action';

const initialState = '';

export const v2CurrentTabReducer = createReducer(
  initialState,
  on(V2CurrentTabAction.setCurrentTab, (state, { currentTab }) => currentTab),
);
