import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { CompareTab, DataSetTab, ProcessTab, ReportTab, RuleSetTab } from '../app-state.model';
import { Ids } from './rulesets.selectors';

export const TabsActions = createActionGroup({
  source: 'Tabs Actions',
  events: {
    'Clear Tabs': emptyProps(),
    'Add Data Set': props<{ tab: DataSetTab; text: string; description: string; datasetText: string; ids: Ids }>(),
    'Add Rule Set': props<{ tab: RuleSetTab; text: string; description: string; datasetText: string; ids: Ids }>(),
    'Add Report': props<{ tab: ReportTab; text: string; description: string; datasetText: string; ids: Ids }>(),
    'Add Process': emptyProps(),
    'Add Process Complete': props<{ tab: ProcessTab; ids: Ids }>(),
    'Add Compare': props<{ tab: CompareTab; ids: Ids }>(),
    'Close Tab': props<{ v2TabKey: string; v2CurrentTabId: string }>(),
    'Close Multiple Tabs': props<{ v2TabIdArr: string[] }>(),
  },
});
