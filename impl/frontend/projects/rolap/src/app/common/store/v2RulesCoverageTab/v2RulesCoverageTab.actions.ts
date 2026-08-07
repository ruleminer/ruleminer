import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { FilterOperators, FilteringRule, UniqueCoverage, VisibleRule, v2RulesCoverageTab } from './types';

export const V2RulesCoverageTabActions = createActionGroup({
  source: 'V2 Rules Coverage Tab Actions',
  events: {
    Add: props<{ coverageTab: v2RulesCoverageTab }>(),
    Remove: props<{ key: string }>(),
    'Remove All': emptyProps(),

    'Add Visible Rule': props<{ rule: VisibleRule }>(),
    'Add Visible Rule Complete': props<{ currentTabId: string; rule: VisibleRule }>(),
    'Remove Visible Rule': props<{ rule: VisibleRule }>(),
    'Remove Visible Rule Complete': props<{ currentTabId: string; rule: VisibleRule }>(),
    'Remove All Visible Rules': emptyProps(),
    'Remove All Visible Rules Complete': props<{ currentTabId: string }>(),

    'Add Filtering Rule': props<{ rule: FilteringRule }>(),
    'Add Filtering Rule Complete': props<{ currentTabId: string; rule: VisibleRule }>(),
    'Remove Filtering Rule': props<{ rule: FilteringRule }>(),
    'Remove Filtering Rule Complete': props<{ currentTabId: string; rule: VisibleRule }>(),
    'Remove All Filtering Rules': emptyProps(),
    'Remove All Filtering Rules Complete': props<{ currentTabId: string }>(),

    'Set Rules Filter Operator': props<{ filterOperator: FilterOperators }>(),
    'Set Rules Filter Operator Complete': props<{ currentTabId: string; filterOperator: FilterOperators }>(),

    'Update Coverage Data After Rules Activity Change': props<{
      currentTabId: string;
      activeRulesUuids: Set<string>;
    }>(),

    'Update Coverage Data After Rules Deletion': props<{
      currentTabId: string;
      rulesUuids: Set<string>;
    }>(),

    'Toggle is Unique Coverage': emptyProps(),
    'Toggle is Unique Coverage Complete': props<{ currentTabId: string }>(),

    'Set Unique Coverage': props<{ uniqueCoverage: UniqueCoverage }>(),
    'Set Unique Coverage Complete': props<{ currentTabId: string; uniqueCoverage: UniqueCoverage }>(),
  },
});
