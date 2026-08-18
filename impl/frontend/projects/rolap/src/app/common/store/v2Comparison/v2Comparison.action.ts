import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { V2Comparison, V2ComparisonForm } from './types';

/**
 * Comparison sub tab
 * This is for RuleSet -> Comparison sub tab
 *
 */

export const V2ComparisonActions = createActionGroup({
  source: 'V2 Comparison Of RuleSet Generation Actions',
  events: {
    Add: props<{ comparison: V2Comparison }>(),
    Remove: props<{ key: string }>(),
    'Remove All': emptyProps(),
    'Save form state': props<{ formState: V2ComparisonForm }>(),
    'Save form state complete': props<{ key: string; formState: V2ComparisonForm }>(),
    'Set second ruleset': props<{ secondRuleset: V2Comparison['secondRuleset'] }>(),
    'Set second ruleset complete': props<{ key: string; secondRuleset: V2Comparison['secondRuleset'] }>(),
    'Set ruleset data to compare': props<{ rulesetDataToCompare: V2Comparison['rulesetDataToCompare'] }>(),
    'Set ruleset data to compare complete': props<{
      key: string;
      rulesetDataToCompare: V2Comparison['rulesetDataToCompare'];
    }>(),
    'Set ruleset meta to compare': props<{ rulesetMetaToCompare: V2Comparison['rulesetMetaToCompare'] }>(),
    'Set ruleset meta to compare complete': props<{
      key: string;
      rulesetMetaToCompare: V2Comparison['rulesetMetaToCompare'];
    }>(),
    'Set selected rows': props<{ selectedRowsUUIDs: string[] }>(),
    'Set selected rows complete': props<{ key: string; selectedRowsUUIDs: string[] }>(),
    'Toggle selected row': props<{ uuid: string }>(),
    'Toggle selected row complete': props<{ key: string; uuid: string }>(),
    'Set show something change warning': props<{ value: boolean }>(),
    'Set show something change warning complete': props<{ key: string; value: boolean }>(),
    'Set calculated data': props<{ data: V2Comparison['calculatedData'] }>(),
    'Set calculated data complete': props<{ key: string; data: V2Comparison['calculatedData'] }>(),
    'Set chart data': props<{ data: V2Comparison['chartData'] }>(),
    'Set chart data complete': props<{ key: string; data: V2Comparison['chartData'] }>(),
  },
});
