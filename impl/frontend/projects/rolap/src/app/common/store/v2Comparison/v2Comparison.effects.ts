import { Injectable } from '@angular/core';

import { filterOutNullish } from '../../utils/rxjsUtils';
import { EMPTY, exhaustMap, mergeMap, of, switchMap, withLatestFrom } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';

import { ProjectService } from '../../../main/project/service/project.service';
import { AppState } from '../app-state.model';
import { CustomActionTypes } from '../effects';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { V2RulesTableActions } from '../v2RulesTable/v2RulesTable.action';
import { selectCurrentV2RulesTableData } from '../v2RulesTable/v2RulesTable.selectors';
import { generateNgrxKey, isRuleSet } from '../v2Tabs/utils';
import { V2TabsActions } from '../v2Tabs/v2Tabs.action';
import { V2Comparison } from './types';
import { V2ComparisonActions } from './v2Comparison.action';
import { selectComparisonCalculatedData, selectCurrentV2ComparisonFormRelationType } from './v2Comparison.selectors';

@Injectable()
export class V2ComparisonEffects {
  //When we add ruleset we want to load comparison
  addRuleSet = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.addTab),
      mergeMap((action) => {
        const type = action.tab.type;
        if (!isRuleSet(type)) return EMPTY;
        const projectId = action.tab.ids.projectId as number;
        const dataSetId = action.tab.ids.dataSetId as number;
        const ruleSetId = action.tab.ids.ruleSetId as number;
        const id = generateNgrxKey(projectId, dataSetId, ruleSetId, 0, 'ruleSet');
        return this.projectService.getComparisonMeasures().pipe(
          switchMap((data) => {
            const dropDownItems = data.map((measure) => ({
              label: measure,
              value: measure,
            }));
            const comparison: V2Comparison = {
              id,
              formState: {
                similarityType: true,
                relationType: true,
                comparisonMeasures: dropDownItems[0].value,
              },
              dropDownItems,
              secondRuleset: {
                name: '',
                id: 0,
                fullName: '',
              },
              rulesetDataToCompare: null,
              rulesetMetaToCompare: null,
              selectedRowsUUIDs: [],
              showSomethingChangeWarning: false,
              calculatedData: null,
              chartData: null,
            };
            return of(V2ComparisonActions.add({ comparison }));
          }),
        );
      }),
    );
  });

  //When we remove all v2Tabs we want to remove
  removeAllTabs = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.closeAllTabs),
      exhaustMap((action) => of(V2ComparisonActions.removeAll())),
    ),
  );

  //When we remove tab we want to remove
  removeTab = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.removeTab),
      exhaustMap((action) => {
        const key = action.key;
        return of(V2ComparisonActions.remove({ key }));
      }),
    ),
  );

  // save form state
  setIsSaved = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2ComparisonActions.saveFormState),
      withLatestFrom(this.store.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, key]) => {
        return of(V2ComparisonActions.saveFormStateComplete({ key, formState: action.formState }));
      }),
    );
  });

  // set second ruleset
  setSecondRuleset = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2ComparisonActions.setSecondRuleset),
      withLatestFrom(this.store.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, key]) => {
        return of(V2ComparisonActions.setSecondRulesetComplete({ key, secondRuleset: action.secondRuleset }));
      }),
    );
  });

  setRuleSetDataToCompare = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2ComparisonActions.setRulesetDataToCompare),
      withLatestFrom(this.store.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, key]) => {
        return of(
          V2ComparisonActions.setRulesetDataToCompareComplete({
            key,
            rulesetDataToCompare: action.rulesetDataToCompare,
          }),
        );
      }),
    );
  });

  setRuleSetMetaToCompare = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2ComparisonActions.setRulesetMetaToCompare),
      withLatestFrom(this.store.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, key]) => {
        return of(
          V2ComparisonActions.setRulesetMetaToCompareComplete({
            key,
            rulesetMetaToCompare: action.rulesetMetaToCompare,
          }),
        );
      }),
    );
  });

  setSelectedRows$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2ComparisonActions.setSelectedRows),
      withLatestFrom(this.store.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, key]) => {
        return of(V2ComparisonActions.setSelectedRowsComplete({ key, selectedRowsUUIDs: action.selectedRowsUUIDs }));
      }),
    );
  });

  toggleSelectedRow$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2ComparisonActions.toggleSelectedRow),
      withLatestFrom(this.store.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, key]) => {
        return of(V2ComparisonActions.toggleSelectedRowComplete({ key, uuid: action.uuid }));
      }),
    );
  });

  showSomethingChangeWarning$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2ComparisonActions.setShowSomethingChangeWarning),
      withLatestFrom(
        this.store.pipe(select(selectCurrentV2TabId)),
        this.store.pipe(select(selectComparisonCalculatedData)),
      ),
      mergeMap(([action, key, calculatedData]) => {
        // Can only set to true if calculatedData exists, but can always set to false
        const shouldShowWarning = action.value && !!calculatedData;
        return of(
          V2ComparisonActions.setShowSomethingChangeWarningComplete({
            key,
            value: shouldShowWarning,
          }),
        );
      }),
    );
  });

  caclculatedData$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2ComparisonActions.setCalculatedData),
      withLatestFrom(this.store.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, key]) => {
        return of(V2ComparisonActions.setCalculatedDataComplete({ key, data: action.data }));
      }),
    );
  });

  chartData$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2ComparisonActions.setChartData),
      withLatestFrom(this.store.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, key]) => {
        return of(V2ComparisonActions.setChartDataComplete({ key, data: action.data }));
      }),
    );
  });

  updateComparisonRowUuidWhenRelationTypeChanges = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2ComparisonActions.saveFormState),
      withLatestFrom(
        this.store.pipe(select(selectCurrentV2ComparisonFormRelationType)),
        this.store.pipe(select(selectCurrentV2RulesTableData), filterOutNullish()),
      ),
      mergeMap(([action, oldRelationType, v2TableData]) => {
        const newRelationType = action.formState.relationType;
        if (oldRelationType === newRelationType || oldRelationType === true)
          return of({ type: CustomActionTypes.NO_ACTION });
        //When the relation type changes form "many to many" to "one to many" we update the comparison row uuids
        const firstRulesetUuids = v2TableData.map((row) => row.uuid)[0];
        return of(
          V2RulesTableActions.updateCurrentTableRowCompareState({
            rowUuid: firstRulesetUuids,
            isRelationOneToMany: newRelationType,
          }),
        );
      }),
    );
  });

  constructor(private store: Store<AppState>, private actions$: Actions, private projectService: ProjectService) {}
}
