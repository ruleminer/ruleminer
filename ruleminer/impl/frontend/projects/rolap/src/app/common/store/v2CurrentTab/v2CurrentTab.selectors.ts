import { createFeatureSelector } from '@ngrx/store';

import { AppState } from '../app-state.model';

export const selectCurrentV2TabId = createFeatureSelector<AppState['v2CurrentTab']>('v2CurrentTab');
