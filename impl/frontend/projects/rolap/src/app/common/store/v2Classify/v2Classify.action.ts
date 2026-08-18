import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { ExampleResult, V2Classify, V2ClassifyCard } from './types';

export const V2ClassifyActions = createActionGroup({
  source: 'V2 Classify Actions',
  events: {
    Add: props<{ classify: V2Classify }>(),
    Remove: props<{ key: string }>(),
    'Remove All': emptyProps(),
  },
});

export const V2ClassifyCardActions = createActionGroup({
  source: 'V2 Classify Card Actions',
  events: {
    Add: emptyProps(),
    'Add Complete': props<{ classifyKey: string; card: V2ClassifyCard }>(),
    'Add By Context Menu': props<{ selectedRows: any[] }>(),
    'Add By Context Menu Complete': props<{ classifyKey: string; selectedRows: any[] }>(),

    'Add Empty Card': emptyProps(),
    'Add Empty Card Complete': props<{ classifyKey: string; card: V2ClassifyCard }>(),

    'Add Random Card': emptyProps(),
    'Add Random Card Complete': props<{ classifyKey: string; card: V2ClassifyCard }>(),

    Remove: props<{ key: string }>(),
    'Remove Complete': props<{ classifyKey: string; key: string }>(),
    'Set Example Table': props<{ key: string; exampleTable: V2ClassifyCard['exampleTable'] }>(), // set example from modal
    'Update Example Table': props<{ key: string; exampleTable: V2ClassifyCard['exampleTable'] }>(), // update example manually in table
    'Set Example Table Complete': props<{
      classifyKey: string;
      key: string;
      exampleTable: V2ClassifyCard['exampleTable'];
    }>(),
    Recalculate: props<{ key: string; labelAttribute: string; columnsTypes: Map<string, string> }>(),
    'Recalculate Complete': props<{ classifyKey: string; key: string; result: ExampleResult }>(),
    'Set show needs recalculation info to true for all current': emptyProps(),
    'Set show needs recalculation info to true for all current complete': props<{ key: string }>(),
    'Set show needs recalculation info For Target Table': props<{ targetTableKey: string }>(),
    'Set show needs recalculation info': props<{
      classifyKey: string;
      key: string;
      showNeedsRecalculationInfo: boolean;
    }>(),
  },
});
