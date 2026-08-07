import { createReducer, on } from '@ngrx/store';

import { StoreVersion } from '../app-state.model';
import { StoreVersionActions } from './version.action';

const initialState: StoreVersion = {
  version: -1,
};

export const versionReducer = createReducer(
  initialState,
  on(StoreVersionActions.setStoreVersion, (state, { version }) => ({ ...state })),
  on(StoreVersionActions.setStoreVersionComplete, (state, { version }) => ({ ...state, version })),
  on(StoreVersionActions.openModalAndClearTabs, (state) => ({ ...state })),
);
