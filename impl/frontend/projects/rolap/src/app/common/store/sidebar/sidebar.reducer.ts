import { createReducer, createSelector, on } from '@ngrx/store';
import { environment } from 'projects/rolap/src/environments/environment';

import { AppState, Sidebar } from '../app-state.model';
import { setSidebarVisibility, setSidebarWidth } from './sidebar.action';

const initialState: Sidebar = {
  width: environment.sidebarWidth,
  previous: 25,
  isVisible: false,
};

export const sidebarReducer = createReducer(
  initialState,
  on(setSidebarWidth, (state, { width, previous }) => ({ ...state, width: width, previous: previous })),
  on(setSidebarVisibility, (state, { value }) => ({ ...state, isVisible: value })),
);

export const sidebarWidthSelector = createSelector(
  (state: AppState) => state.sidebar,
  (sidebar: Sidebar) => sidebar.width,
);

export const sidebarPreviousWidthSelector = createSelector(
  (state: AppState) => state.sidebar,
  (sidebar: Sidebar) => sidebar.previous,
);

export const sidebarVisibilitySelector = createSelector(
  (state: AppState) => state.sidebar,
  (sidebar: Sidebar) => sidebar.isVisible,
);
