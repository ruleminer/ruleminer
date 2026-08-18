import { createFeatureSelector, createSelector } from '@ngrx/store';

import { AuthState } from './types';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectIsAuthorized = createSelector(selectAuthState, (state: AuthState) => state.authorized);

export const selectUserId = createSelector(selectAuthState, (state: AuthState) => state.userId);
