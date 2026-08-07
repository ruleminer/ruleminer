import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { SelectedGraphNodes, V2VisualizationTab, selectedRuleV2VisualizationTab } from './types';

export const V2VisualizationTabActions = createActionGroup({
  source: 'V2 VisualizationTab Actions',
  events: {
    Add: props<{ visualizationTab: V2VisualizationTab }>(),
    Remove: props<{ key: string }>(),
    'Remove All': emptyProps(),
    'Toggle Rule': props<{ selectedRule: selectedRuleV2VisualizationTab; isUserAction: boolean }>(),
    'Toggle Rule Complete': props<{
      key: string;
      selectedRule: selectedRuleV2VisualizationTab;
      isUserAction: boolean;
    }>(),
    'Set Search Value': props<{ searchValue: string }>(),
    'Set Search Value Complete': props<{ key: string; searchValue: string }>(),
    'Toggle Hidden Rules UUID': props<{ hiddenRulesUUID: string }>(),
    'Toggle Hidden Rules UUID Complete': props<{ key: string; hiddenRulesUUID: string }>(),
    'Set Rules And Clear Search': props<{ rulesUUIDs: string[] }>(),
    'Set Rules And Clear Search Complete': props<{ key: string; selectedRules: selectedRuleV2VisualizationTab[] }>(),
    'Unselect Rule': props<{ rowUuid: string; isUserAction: boolean }>(),
    'Unselect Rule Complete': props<{ key: string; isUserAction: boolean; rowUuid: string }>(),
    'Set Show Rules Were Unselected Info': props<{ showSomeRulesWereUnselectedInfo: boolean }>(),
    'Set Show Rules Were Unselected Info Complete': props<{ key: string; showSomeRulesWereUnselectedInfo: boolean }>(),
    'Set Selected Graph Nodes': props<{ selectedGraphNodes: SelectedGraphNodes }>(),
    'Set Selected Graph Nodes Complete': props<{ key: string; selectedGraphNodes: SelectedGraphNodes }>(),
  },
});
