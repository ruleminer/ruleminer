import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { filterOutNullish } from '../../utils/rxjsUtils';
import { EMPTY, Observable, exhaustMap, filter, map, mergeMap, of, withLatestFrom } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { environment } from '../../../../environments/environment';
import { convertRulesBigTableForBackend } from '../../../main/data-upload/utils/utils';
import { AppState } from '../app-state.model';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { V2RulesTableActions } from '../v2RulesTable/v2RulesTable.action';
import {
  selectCurrentV2RulesTable,
  selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered,
  selectProjectRulesTableData,
} from '../v2RulesTable/v2RulesTable.selectors';
import { generateNgrxKey, isRuleSet } from '../v2Tabs/utils';
import { V2TabsActions } from '../v2Tabs/v2Tabs.action';
import { selectCurrentV2Tab, selectCurrentV2TabIds } from '../v2Tabs/v2Tabs.selectors';
import { FilterOperators, UniqueCoverage } from './types';
import { V2RulesCoverageTabActions } from './v2RulesCoverageTab.actions';
import { getCurrentTabFilteringRules, selectIsUniqueCoverage } from './v2RulesCoverageTab.selectors';

@Injectable()
export class V2RulesCoverageTabEffects {
  addNewTab = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.addTab),
      filter((action) => isRuleSet(action.tab.type)),
      map((action) => {
        const projectId = action.tab.ids.projectId as number;
        const dataSetId = action.tab.ids.dataSetId as number;
        const ruleSetId = action.tab.ids.ruleSetId as number;
        const id = generateNgrxKey(projectId, dataSetId, ruleSetId, 0, 'ruleSet');
        return V2RulesCoverageTabActions.add({
          coverageTab: {
            id: id,
            filterOperator: FilterOperators.OR,
            visibleRules: [],
            filteringRules: [],
            isUniqueCoverage: false,
            uniqueExamples: {
              unique_examples: [],
            },
          },
        });
      }),
    );
  });

  removeTab = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.removeTab),
      exhaustMap((action) => {
        const key = action.key;
        return of(V2RulesCoverageTabActions.remove({ key }));
      }),
    );
  });

  removeAllTabs = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.closeAllTabs),
      exhaustMap(() => of(V2RulesCoverageTabActions.removeAll())),
    );
  });

  addVisibleRule = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesCoverageTabActions.addVisibleRule),
      withLatestFrom(this.store.select(selectCurrentV2TabId)),
      mergeMap(([action, currentTabId]) => {
        if (!currentTabId) return EMPTY;
        return of(
          V2RulesCoverageTabActions.addVisibleRuleComplete({
            currentTabId,
            rule: action.rule,
          }),
        );
      }),
    );
  });

  removeVisibleRule = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesCoverageTabActions.removeVisibleRule),
      withLatestFrom(this.store.select(selectCurrentV2TabId)),
      mergeMap(([action, currentTabId]) => {
        if (!currentTabId) return EMPTY;
        return of(
          V2RulesCoverageTabActions.removeVisibleRuleComplete({
            currentTabId,
            rule: action.rule,
          }),
        );
      }),
    );
  });

  removeAllVisibleRules = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesCoverageTabActions.removeAllVisibleRules),
      withLatestFrom(this.store.select(selectCurrentV2TabId)),
      mergeMap(([action, currentTabId]) => {
        if (!currentTabId) return EMPTY;
        return of(
          V2RulesCoverageTabActions.removeAllVisibleRulesComplete({
            currentTabId,
          }),
        );
      }),
    );
  });

  addFilteringRule = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesCoverageTabActions.addFilteringRule),
      withLatestFrom(this.store.select(selectCurrentV2TabId)),
      filterOutNullish(),
      mergeMap(([action, currentTabId]) => {
        if (!currentTabId) return EMPTY;
        return of(V2RulesCoverageTabActions.addFilteringRuleComplete({ currentTabId, rule: action.rule }));
      }),
    );
  });

  removeFilteringRule = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesCoverageTabActions.removeFilteringRule),
      withLatestFrom(this.store.select(selectCurrentV2TabId)),
      filterOutNullish(),
      mergeMap(([action, currentTabId]) => {
        if (!currentTabId) return EMPTY;
        return of(V2RulesCoverageTabActions.removeFilteringRuleComplete({ currentTabId, rule: action.rule }));
      }),
    );
  });

  removeAllFilteringRules = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesCoverageTabActions.removeAllFilteringRules),
      withLatestFrom(this.store.select(selectCurrentV2TabId)),
      mergeMap(([action, currentTabId]) => {
        if (!currentTabId) return EMPTY;
        return of(
          V2RulesCoverageTabActions.removeAllFilteringRulesComplete({
            currentTabId,
          }),
        );
      }),
    );
  });

  setRulesFilterOperator = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesCoverageTabActions.setRulesFilterOperator),
      withLatestFrom(this.store.select(selectCurrentV2Tab)),
      filterOutNullish(),
      mergeMap(([action, currentTab]) => {
        if (!currentTab) return EMPTY;
        return of(
          V2RulesCoverageTabActions.setRulesFilterOperatorComplete({
            currentTabId: currentTab.id!,
            filterOperator: action.filterOperator,
          }),
        );
      }),
    );
  });

  // On rule activity change
  onRulesActivityChange = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        V2RulesTableActions.updateCurrentTableRowActiveStateComplete,
        V2RulesTableActions.currentTableActivesHeaderToggleComplete,
        V2RulesTableActions.updateFilteredRowsUuidsComplete,
      ),
      mergeMap((action) => {
        return this.store.select(selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered).pipe(
          filterOutNullish(),
          map((activeRowsUuidsArray) => {
            const activeRulesUuids: Set<string> = new Set(activeRowsUuidsArray);
            return { currentTabId: action.key, activeRulesUuids };
          }),
        );
      }),
      mergeMap((res) => {
        return of(V2RulesCoverageTabActions.updateCoverageDataAfterRulesActivityChange(res));
      }),
    );
  });

  // On rule remove from table
  onRemoveRuleFromTable = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesTableActions.removeRowFromCurrentTable),
      withLatestFrom(this.store.select(selectCurrentV2TabId)),
      mergeMap(([action, currentTabId]) => {
        if (!currentTabId) return EMPTY;
        return this.store.select(selectProjectRulesTableData).pipe(
          filterOutNullish(),
          map((rows) => {
            const rulesUuids: Set<string> = new Set<string>(rows.v2RulesTableData.map((row) => row.uuid));

            return V2RulesCoverageTabActions.updateCoverageDataAfterRulesDeletion({
              currentTabId,
              rulesUuids,
            });
          }),
        );
      }),
    );
  });

  toggleIsUniqueCoverage = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesCoverageTabActions.toggleIsUniqueCoverage),
      withLatestFrom(this.store.select(selectCurrentV2TabId)),
      filterOutNullish(),
      mergeMap(([action, currentTabId]) => {
        return of(V2RulesCoverageTabActions.toggleIsUniqueCoverageComplete({ currentTabId }));
      }),
    );
  });

  uniqueToggleChange = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        V2RulesCoverageTabActions.toggleIsUniqueCoverageComplete,
        V2RulesCoverageTabActions.removeFilteringRuleComplete,
        V2RulesCoverageTabActions.addFilteringRuleComplete,
      ),
      withLatestFrom(
        this.store.select(selectIsUniqueCoverage).pipe(filterOutNullish()),
        this.store.select(getCurrentTabFilteringRules).pipe(filterOutNullish()),
        this.store.select(selectCurrentV2TabIds).pipe(filterOutNullish()),
        this.store.select(selectCurrentV2RulesTable).pipe(filterOutNullish()),
      ),
      filterOutNullish(),
      mergeMap(([action, isUniqueCoverage, filteringRules, currentIds, v2RulesTable]) => {
        if (isUniqueCoverage) {
          const putData = {
            original_ruleset_id: currentIds.ruleSetId,
            ruleset: {
              meta: v2RulesTable.meta,
              rules: convertRulesBigTableForBackend(v2RulesTable.data),
            },
          };
          return this.putUniqueCoverage(currentIds.dataSetId?.toString() ?? '', putData).pipe(
            map((uniqueCoverage) => {
              const uniqueExamplesFiltered = uniqueCoverage.unique_examples.filter((example) =>
                filteringRules.some((rule) => rule.uuid === example.uuid),
              );
              return V2RulesCoverageTabActions.setUniqueCoverage({
                uniqueCoverage: { unique_examples: uniqueExamplesFiltered },
              });
            }),
          );
        } else {
          return of(V2RulesCoverageTabActions.setUniqueCoverage({ uniqueCoverage: { unique_examples: [] } }));
        }
      }),
    );
  });

  private putUniqueCoverage(dataSetId: string, putData: any): Observable<UniqueCoverage> {
    const url = `${environment.calcApiUrl}/${dataSetId}/unique_examples`;
    return this.http.put<UniqueCoverage>(url, putData);
  }

  setUniqueCoverage = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2RulesCoverageTabActions.setUniqueCoverage),
      withLatestFrom(this.store.select(selectCurrentV2TabId)),
      filterOutNullish(),
      mergeMap(([action, currentTabId]) => {
        return of(
          V2RulesCoverageTabActions.setUniqueCoverageComplete({ currentTabId, uniqueCoverage: action.uniqueCoverage }),
        );
      }),
    );
  });

  constructor(private actions$: Actions, private http: HttpClient, private store: Store<AppState>) {}
}
