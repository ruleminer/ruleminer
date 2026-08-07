import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { SubTabsNames, TabType } from '../app-state.model';
import { V2Tab } from './types';

export const V2TabsActions = createActionGroup({
  source: 'V2Tabs Actions',
  events: {
    'Close All Tabs': emptyProps(),
    'Add Tab': props<{ tab: V2Tab }>(),
    'Close Tab': props<{ key: string }>(),
    'Close Multiple Tabs': props<{ data: string[] }>(),
    'Remove Tab': props<{ key: string }>(),
    'Set Current Tab Description': props<{ description: string }>(),
    'Set Current Tab Description Complete': props<{ key: string; description: string }>(),
    'Set Is Saved': props<{ isSaved: boolean }>(),
    'Set Is Saved Complete': props<{ key: string; isSaved: boolean }>(),
    'Set Current Tab Description And Name': props<{ name: string; description?: string }>(),
    'Set v2 Tab Description And Name Complete': props<{
      key: string;
      name: string;
      tabType: TabType;
      description?: string;
    }>(),
    'Update Multiple Tabs Dataset Text': props<{ keys: string[]; datasetText: string }>(),
    'Set Current Sub Tab Index': props<{ index: number }>(),
    'Set Current Sub Tab Index By Sub Tab Name': props<{ name: SubTabsNames }>(),
    'Set Current Sub Tab Index Complete': props<{ key: string; index: number }>(),
  },
});
