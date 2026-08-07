import { createReducer, on } from '@ngrx/store';

import { AuthActions } from './auth.action';
import { AuthState } from './types';

const initialState: AuthState = {
  authorized: false,
  userId: null,
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.initialized, (state) => {
    return { ...state, authorized: true };
  }),
  on(AuthActions.loadUserProfile, (state) => {
    return { ...state };
  }),
  on(AuthActions.userProfileLoaded, (state, { userId }) => {
    return { ...state, userId };
  }),
  on(AuthActions.userProfileLoadError, (state) => {
    return { ...state, userId: null };
  }),
);
