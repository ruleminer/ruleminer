import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const V2PredictionTabActions = createActionGroup({
  source: 'V2 PredictionTab Actions',
  events: {
    Set: props<{ selectedDatasetId: number }>(),
    'Set Complete': props<{ currentTabId: string; selectedDatasetId: number }>(),

    'Update Selected Dataset ID': props<{ selectedDatasetId: number }>(),
    'Update Selected Dataset ID Complete': props<{ currentTabId: string; selectedDatasetId: number }>(),

    'Set Visible Dataset': emptyProps(),
    'Set Visible Dataset Complete': props<{ currentTabId: string; selectedDatasetId: number }>(),
    Remove: props<{ currentTabId: string }>(),
    'Remove all': emptyProps(),
  },
});
