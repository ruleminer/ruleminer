import { Injectable } from '@angular/core';

import { EMPTY, exhaustMap, mergeMap, of, withLatestFrom } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';

import { AppState } from '../app-state.model';
import { generateNgrxKey, isDataSet, isRuleSet } from '../v2Tabs/utils';
import { V2TabsActions } from '../v2Tabs/v2Tabs.action';
import { selectCurrentV2Tab } from '../v2Tabs/v2Tabs.selectors';
import { V2DataSetTableActions } from './v2DataSetTable.action';

@Injectable()
export class V2DataSetTableEffects {
  addRuleSet = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.addTab),
      mergeMap((action) => {
        const type = action.tab.type;
        if (!isRuleSet(type) && !isDataSet(type)) return EMPTY;
        const projectId = action.tab.ids.projectId as number;
        const dataSetId = action.tab.ids.dataSetId as number;
        const ruleSetId = action.tab.ids.ruleSetId || 0;
        const id = generateNgrxKey(projectId, dataSetId, ruleSetId, 0, type);
        const dataSetTable = { id, state: '' };
        return of(V2DataSetTableActions.add({ dataSetTable }));
      }),
    );
  });

  removeAllTabs = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.closeAllTabs),
      exhaustMap(() => of(V2DataSetTableActions.removeAll())),
    ),
  );

  removeTab = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.removeTab),
      exhaustMap((action) => {
        const key = action.key;
        return of(V2DataSetTableActions.remove({ key }));
      }),
    ),
  );

  setState = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2DataSetTableActions.setState),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        const tableState = action.tableState;
        return of(V2DataSetTableActions.setStateComplete({ key: currentTabId, tableState }));
      }),
    );
  });

  setFilterState = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2DataSetTableActions.setFilterState),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        return of(
          V2DataSetTableActions.setFilterStateComplete({
            key: currentTabId,
            filter: action.filter,
            sort: action.sort,
            totalCount: action.totalCount,
          }),
        );
      }),
    );
  });

  setFilteredCount = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2DataSetTableActions.setFilteredCount),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        return of(
          V2DataSetTableActions.setFilteredCountComplete({
            key: currentTabId,
            filteredCount: action.filteredCount,
          }),
        );
      }),
    );
  });

  setColumns = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2DataSetTableActions.setColumns),
      withLatestFrom(this.store$.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, currentTab]) => {
        const currentTabId = currentTab?.id as string;
        return of(
          V2DataSetTableActions.setColumnsComplete({
            key: currentTabId,
            columns: action.columns,
          }),
        );
      }),
    );
  });

  constructor(private actions$: Actions, private store$: Store<AppState>) {}
}
