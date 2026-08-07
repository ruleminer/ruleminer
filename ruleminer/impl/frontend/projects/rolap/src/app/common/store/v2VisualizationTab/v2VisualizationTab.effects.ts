import { Injectable } from '@angular/core';

import { filterOutNullish } from '../../utils/rxjsUtils';
import { EMPTY, exhaustMap, mergeMap, of, withLatestFrom } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { AppState } from '../app-state.model';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { undoRedoTriggerActions } from '../v2RulesTable/undoRedoUtils';
import { V2RulesTableActions } from '../v2RulesTable/v2RulesTable.action';
import { generateNgrxKey, isRuleSet } from '../v2Tabs/utils';
import { V2TabsActions } from '../v2Tabs/v2Tabs.action';
import { V2VisualizationTab } from './types';
import { V2VisualizationTabActions } from './v2VisualizationTab.action';
import { selectCurrentV2VisualizationRulesList } from './v2VisualizationTab.selectors';

@Injectable()
export class v2VisualizationTabEffects {
  //When we add ruleset we want to load visualization tab
  addRuleSet = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.addTab),
      exhaustMap((action) => {
        const type = action.tab.type;
        if (!isRuleSet(type)) return EMPTY;
        const projectId = action.tab.ids.projectId as number;
        const dataSetId = action.tab.ids.dataSetId as number;
        const ruleSetId = action.tab.ids.ruleSetId as number;
        const id = generateNgrxKey(projectId, dataSetId, ruleSetId, 0, type);

        const visualizationTab: V2VisualizationTab = {
          id,
          searchValue: '',
          selectedRules: [],
          hiddenRulesUUIDs: [],
          showSomeRulesWereUnselectedInfo: false,
          selectedGraphNodes: [],
        };
        return of(V2VisualizationTabActions.add({ visualizationTab }));
      }),
    ),
  );

  //When we remove all v2Tabs we want to remove all prediction subTabs
  removeAllTabs = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.closeAllTabs),
      exhaustMap(() => of(V2VisualizationTabActions.removeAll())),
    ),
  );

  //When we remove tab that uses classify we want to remove prediction subTab
  removeTab = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.removeTab),
      exhaustMap((action) => {
        const key = action.key;
        return of(V2VisualizationTabActions.remove({ key }));
      }),
    ),
  );

  toggleRule = createEffect(() =>
    this.actions$.pipe(
      ofType(V2VisualizationTabActions.toggleRule),
      withLatestFrom(this.store$.select(selectCurrentV2TabId)),
      mergeMap(([action, key]) => {
        const selectedRule = action.selectedRule;
        const isUserAction = action.isUserAction;
        return of(V2VisualizationTabActions.toggleRuleComplete({ key, selectedRule, isUserAction }));
      }),
    ),
  );

  setSearchValue = createEffect(() =>
    this.actions$.pipe(
      ofType(V2VisualizationTabActions.setSearchValue),
      withLatestFrom(this.store$.select(selectCurrentV2TabId)),
      mergeMap(([action, key]) => {
        return of(V2VisualizationTabActions.setSearchValueComplete({ key, searchValue: action.searchValue }));
      }),
    ),
  );

  toggleHiddenRulesUUID = createEffect(() =>
    this.actions$.pipe(
      ofType(V2VisualizationTabActions.toggleHiddenRulesUUID),
      withLatestFrom(this.store$.select(selectCurrentV2TabId)),
      mergeMap(([action, key]) => {
        return of(
          V2VisualizationTabActions.toggleHiddenRulesUUIDComplete({ key, hiddenRulesUUID: action.hiddenRulesUUID }),
        );
      }),
    ),
  );

  setRulesAndClearSearch = createEffect(() =>
    this.actions$.pipe(
      ofType(V2VisualizationTabActions.setRulesAndClearSearch),
      withLatestFrom(
        this.store$.select(selectCurrentV2TabId),
        this.store$.select(selectCurrentV2VisualizationRulesList).pipe(filterOutNullish()),
      ),
      mergeMap(([action, key, rules]) => {
        const selectedRules = action.rulesUUIDs.map((ruleUUid) => {
          const rule = rules.find((r) => r.uuid === ruleUUid);
          const selectedSubconditionIndexes =
            rule?.premise.subconditions.reduce((acc: number[], subcondition: any, index: number) => {
              acc.push(index);
              return acc;
            }, []) || [];

          return {
            ruleUUid,
            selectedSubconditionIndexes,
          };
        });

        return of(V2VisualizationTabActions.setRulesAndClearSearchComplete({ key, selectedRules }));
      }),
    ),
  );
  //when user deleted or edited rule from rules table we want to unselect it in visualization tab
  unSelectAffectedRule = createEffect(() => {
    return this.actions$.pipe(
      ofType(...undoRedoTriggerActions),
      mergeMap((action) => {
        if (action.type === V2RulesTableActions.removeRowFromCurrentTable.type) {
          const specificAction = action as ReturnType<typeof V2RulesTableActions.removeRowFromCurrentTable>;
          const rowUuid = specificAction.rowUuid;

          return of(V2VisualizationTabActions.unselectRule({ rowUuid, isUserAction: false }));
        }
        if (action.type === V2RulesTableActions.updateCurrentTableRowComplete.type) {
          const specificAction = action as ReturnType<typeof V2RulesTableActions.updateCurrentTableRowComplete>;
          const rowUuid = specificAction.editedRow.uuid;
          return of(V2VisualizationTabActions.unselectRule({ rowUuid, isUserAction: false }));
        }
        return EMPTY;
      }),
    );
  });

  unselectRule = createEffect(() =>
    this.actions$.pipe(
      ofType(V2VisualizationTabActions.unselectRule),
      withLatestFrom(this.store$.select(selectCurrentV2TabId)),
      mergeMap(([action, key]) => {
        const rowUuid = action.rowUuid;
        const isUserAction = action.isUserAction;
        return of(V2VisualizationTabActions.unselectRuleComplete({ key, rowUuid, isUserAction }));
      }),
    ),
  );

  setShowRulesWereUnselectedInfo = createEffect(() =>
    this.actions$.pipe(
      ofType(V2VisualizationTabActions.setShowRulesWereUnselectedInfo),
      withLatestFrom(this.store$.select(selectCurrentV2TabId)),
      mergeMap(([action, key]) => {
        return of(
          V2VisualizationTabActions.setShowRulesWereUnselectedInfoComplete({
            key,
            showSomeRulesWereUnselectedInfo: action.showSomeRulesWereUnselectedInfo,
          }),
        );
      }),
    ),
  );

  unselectComplete = createEffect(() =>
    this.actions$.pipe(
      ofType(V2VisualizationTabActions.unselectRuleComplete),
      mergeMap((action) => {
        const showSomeRulesWereUnselectedInfo = !action.isUserAction;
        return of(V2VisualizationTabActions.setShowRulesWereUnselectedInfo({ showSomeRulesWereUnselectedInfo }));
      }),
    ),
  );

  setSelectedGraphNodes = createEffect(() =>
    this.actions$.pipe(
      ofType(V2VisualizationTabActions.setSelectedGraphNodes),
      withLatestFrom(
        this.store$.select(selectCurrentV2TabId),
        this.store$.select(selectCurrentV2VisualizationRulesList),
      ),
      mergeMap(([action, key, rulesList]) => {
        const validRuleUUIDs = new Set(rulesList.map((rule) => rule.uuid));
        const filteredNodes = action.selectedGraphNodes
          .map((nodeArray: any) => nodeArray.filter((node: any) => validRuleUUIDs.has(node.rule_uuid)))
          .filter((nodeArray) => nodeArray.length > 0);

        return of(V2VisualizationTabActions.setSelectedGraphNodesComplete({ key, selectedGraphNodes: filteredNodes }));
      }),
    ),
  );

  constructor(private actions$: Actions, private store$: Store<AppState>) {}
}
