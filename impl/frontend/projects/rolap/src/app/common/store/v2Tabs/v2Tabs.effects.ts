import { Injectable } from '@angular/core';

import {
  EMPTY,
  catchError,
  concatMap,
  exhaustMap,
  from,
  map,
  merge,
  mergeMap,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store, select } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { DatasetService } from '../../../main/project/dataset/service/dataset.service';
import { TreeviewRefreshService } from '../../../main/project/dataset/treeview/service/treeview-refresh.service';
import { NotifyService } from '../../services/notify/notify.service';
import { RuleSetApiService } from '../../services/rule-set/rule-set-api.service';
import { AppState } from '../app-state.model';
import { TabsActions } from '../ruleSets/tabs.action';
import { V2CurrentTabAction } from '../v2CurrentTab/v2CurrentTab.action';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { TabTypes } from './types';
import { filterTabsByKey, generateNgrxKey } from './utils';
import { V2TabsActions } from './v2Tabs.action';
import { memoSelectAllV2Tabs, selectAllV2Tabs, selectCurrentSubTabs, selectCurrentV2Tab } from './v2Tabs.selectors';
import { ProjectActions } from '../project/project.action';

@Injectable()
export class V2TabsEffects {
  //When V2TabsActions.closeTab, we update v2 current tab and remove the tab from v2 tabs
  closeTab$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.closeTab),
      withLatestFrom(
        this.store.pipe(select(selectCurrentV2TabId)), // Get the current tab id
        this.store.pipe(select(memoSelectAllV2Tabs)), // Get all tabs
      ),
      concatMap(([action, currentTabId, tabs]) => {
        const closedTabKey = action.key;
        const closedTabIndex = tabs.findIndex((tab) => tab && tab.id === closedTabKey);

        const isClosedTabCurrent = currentTabId === closedTabKey;
        let nextTabId = currentTabId;

        if (isClosedTabCurrent && tabs.length > 1) {
          const newCurrentTabIndex = closedTabIndex === 0 ? 1 : closedTabIndex - 1;
          nextTabId = tabs[newCurrentTabIndex]?.id || '';
        }

        // Dispatch both setCurrentTab and removeTab actions.
        const actions: Action[] = [
          V2CurrentTabAction.setCurrentTab({ currentTab: nextTabId }),
          V2TabsActions.removeTab({ key: closedTabKey }),
        ];

        return from(actions);
      }),
    ),
  );

  //When all tabs closed we update v2 current tab to empty string
  closeAllTabs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.closeAllTabs),
      concatMap(() => {
        return of(V2CurrentTabAction.setCurrentTab({ currentTab: '' }));
      }),
    ),
  );

  //TODO: Figure out what to do when loading data fails. RN when loading data fails we set description to empty string
  //When we add v2 Tab we want to get initial description from the server
  setInitialTabDescription = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.addTab),
      switchMap((action) => {
        if (action.tab.type === TabTypes.RULE_SET) {
          return this.ruleSetApiService.getRulesetDetails(action.tab.ids.dataSetId!, action.tab.ids.ruleSetId!).pipe(
            map((details) => ({ key: action.tab.id, description: details.description })),
            switchMap(({ key, description }) =>
              of(V2TabsActions.setCurrentTabDescriptionComplete({ key, description })),
            ),
            catchError(() =>
              of(V2TabsActions.setCurrentTabDescriptionComplete({ key: action.tab.id, description: '' })),
            ),
          );
        }
        if (action.tab.type === TabTypes.DATA_SET) {
          return this.datasetService.getDatasetInfo(action.tab.ids.dataSetId!).pipe(
            map(({ name, description }) => ({ key: action.tab.id, description })),
            switchMap(({ key, description }) =>
              of(V2TabsActions.setCurrentTabDescriptionComplete({ key, description })),
            ),
            catchError(() =>
              of(V2TabsActions.setCurrentTabDescriptionComplete({ key: action.tab.id, description: '' })),
            ),
          );
        }
        return EMPTY;
      }),
    );
  });

  //save description and name to the server and update v2Tabs
  setCurrentTabDescriptionAndName = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.setCurrentTabDescriptionAndName),
      withLatestFrom(this.store.pipe(select(selectCurrentV2TabId)), this.store.pipe(select(selectCurrentV2Tab))),
      mergeMap(([action, key, v2Tab]) => {
        if (!v2Tab) return EMPTY;
        if (![TabTypes.RULE_SET, TabTypes.DATA_SET].includes(v2Tab.type)) return EMPTY;

        const dataSetId = v2Tab.ids.dataSetId as number;
        const ruleSetId = v2Tab.ids.ruleSetId as number;
        const body = {
          name: action.name,
          ...(action.description && { description: action.description }), //Description is optional
        };
        const service =
          v2Tab.type === TabTypes.RULE_SET
            ? this.ruleSetApiService.renameRuleset(dataSetId, ruleSetId, body)
            : this.datasetService.renameDataset(dataSetId, body);
        return service.pipe(
          tap(() => {
            this.store.dispatch(ProjectActions.signalTreeDataRefresh())
            if (v2Tab.type === TabTypes.RULE_SET) {
              this.notifyService.showNotify(this.translate.instant(`project.description_tab.save.success`), 'success');
            } else if (v2Tab.type === TabTypes.DATA_SET) {
              this.notifyService.showNotify(this.translate.instant(`dataset.statistic_tab.success`), 'success');
            }
          }),
          map(() => body),
          switchMap((body) => {
            const payload = {
              key,
              ...body, //Description is optional
              tabType: v2Tab.type,
            };
            return of(V2TabsActions.setV2TabDescriptionAndNameComplete(payload));
          }),
        );
      }),
    );
  });

  //When we change title of dataset tab we need to update rulesets that are open.
  setV2TabDescriptionAndNameCompleteDataset = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.setV2TabDescriptionAndNameComplete),
      withLatestFrom(this.store.pipe(select(selectAllV2Tabs))),
      switchMap(([action, allv2Tabs]) => {
        if (action.tabType !== TabTypes.DATA_SET) return EMPTY;
        const rulsetTabsToUpdate = filterTabsByKey(allv2Tabs, action.key);
        return of(V2TabsActions.updateMultipleTabsDatasetText({ keys: rulsetTabsToUpdate, datasetText: action.name }));
      }),
    );
  });

  //set is saved for current tab
  setIsSaved = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.setIsSaved),
      withLatestFrom(this.store.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, key]) => {
        return of(V2TabsActions.setIsSavedComplete({ key, isSaved: action.isSaved }));
      }),
    );
  });

  /*
-----------------------------------------------------------------------------------------

  Below this comment we observe old tabs and update v2Tabs
  This is the only place where we update v2Tabs Until we remove old tabs
  This is a work in progress.

-----------------------------------------------------------------------------------------
*/

  clearTabs = createEffect(() => {
    return this.actions$.pipe(
      ofType(TabsActions.clearTabs),
      exhaustMap(() => {
        return of(V2TabsActions.closeAllTabs());
      }),
    );
  });

  //When we add a new Rule Set Tab, we add it to v2Tabs
  addRuleSet = createEffect(() => {
    return this.actions$.pipe(
      ofType(TabsActions.addRuleSet),
      exhaustMap((action) => {
        const projectId = action.ids.projectId as number;
        const dataSetId = action.ids.dataSetId as number;
        const ruleSetId = action.ids.ruleSetId as number;
        const reportId = 0;
        const type = TabTypes.RULE_SET;
        const id = generateNgrxKey(projectId, dataSetId, ruleSetId, reportId, type);
        return of(
          V2TabsActions.addTab({
            tab: {
              id,
              ids: { projectId, dataSetId, ruleSetId, reportId },
              type,
              text: action.text,
              description: action.description,
              datasetText: action.datasetText,
              isSaved: true,
              currentSubTabIndex: 0,
            },
          }),
        );
      }),
    );
  });

  //When we add a new Data Set Tab, we add it to v2Tabs
  addDataSet = createEffect(() => {
    return this.actions$.pipe(
      ofType(TabsActions.addDataSet),
      exhaustMap((action) => {
        const projectId = action.ids.projectId as number;
        const dataSetId = action.ids.dataSetId as number;
        const ruleSetId = 0;
        const reportId = 0;
        const type = TabTypes.DATA_SET;
        const id = generateNgrxKey(projectId, dataSetId, ruleSetId, reportId, type);

        return of(
          V2TabsActions.addTab({
            tab: {
              id,
              ids: { projectId, dataSetId, ruleSetId, reportId },
              type,
              text: action.text,
              description: action.description,
              datasetText: action.datasetText,
              isSaved: true,
              currentSubTabIndex: 0,
            },
          }),
        );
      }),
    );
  });

  //When we add a new Report Tab, we add it to v2Tabs
  addReport = createEffect(() => {
    return this.actions$.pipe(
      ofType(TabsActions.addReport),
      exhaustMap((action) => {
        const projectId = action.ids.projectId as number;
        const dataSetId = action.ids.dataSetId as number;
        const ruleSetId = 0;
        const reportId = action.ids.reportId as number;
        const type = TabTypes.REPORT;
        const id = generateNgrxKey(projectId, dataSetId, ruleSetId, reportId, type);

        return of(
          V2TabsActions.addTab({
            tab: {
              id,
              ids: { projectId, dataSetId, ruleSetId, reportId },
              type,
              text: action.text,
              description: action.description,
              datasetText: action.datasetText,
              isSaved: true,
              currentSubTabIndex: 0,
            },
          }),
        );
      }),
    );
  });

  addProcess = createEffect(() => {
    return this.actions$.pipe(
      ofType(TabsActions.addProcess),
      exhaustMap((action) => {
        const type = TabTypes.PROCESS;
        const id = TabTypes.PROCESS;

        return of(
          V2TabsActions.addTab({
            tab: {
              id,
              ids: {
                projectId: undefined,
                dataSetId: undefined,
                ruleSetId: undefined,
                reportId: undefined,
              },
              isSaved: true,
              type,
              text: '', //Process tab does not have text we use text from pl/en.json in html
              description: '',
              datasetText: '',
              currentSubTabIndex: 0,
            },
          }),
        );
      }),
    );
  });

  addCompare = createEffect(() => {
    return this.actions$.pipe(
      ofType(TabsActions.addCompare),
      exhaustMap((action) => {
        const type = TabTypes.COMPARE;
        const id = action.tab.id;

        return of(
          V2TabsActions.addTab({
            tab: {
              id,
              ids: { ...action.ids },
              currentSubTabIndex: 0,
              type,
              text: TabTypes.COMPARE,
              isSaved: true,
              description: '',
              datasetText: '',
            },
          }),
        );
      }),
    );
  });

  //When we close a tab, we remove it from v2Tabs
  closeTab = createEffect(() => {
    return this.actions$.pipe(
      ofType(TabsActions.closeTab),
      exhaustMap((action) => {
        const v2TabKey = action.v2TabKey;
        return of(V2TabsActions.closeTab({ key: v2TabKey }));
      }),
    );
  });

  //When we close multiple tabs, we close those tabs in v2Tabs
  closeMultipleTabs = createEffect(() => {
    return this.actions$.pipe(
      ofType(TabsActions.closeMultipleTabs),
      exhaustMap(({ v2TabIdArr }) =>
        merge(
          ...v2TabIdArr.map((key) => {
            return of(V2TabsActions.closeTab({ key }));
          }),
        ),
      ),
    );
  });

  setCurrentSubTabIndexBySubTabName = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.setCurrentSubTabIndexBySubTabName),
      withLatestFrom(this.store.pipe(select(selectCurrentV2TabId)), this.store.pipe(select(selectCurrentSubTabs))),
      concatMap(([action, key, tabs]) => {
        const index = tabs.findIndex((tab) => tab.name === action.name);
        return of(V2TabsActions.setCurrentSubTabIndexComplete({ index, key }));
      }),
    );
  });

  //set current Sub Tab Index
  setCurrentSubTabIndex = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2TabsActions.setCurrentSubTabIndex),
      withLatestFrom(
        this.store.pipe(select(selectCurrentV2TabId)), // Get the current tab id
      ),
      concatMap(([action, key]) => {
        return of(V2TabsActions.setCurrentSubTabIndexComplete({ index: action.index, key }));
      }),
    );
  });

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private ruleSetApiService: RuleSetApiService,
    private datasetService: DatasetService,
    private notifyService: NotifyService,
    private translate: TranslateService,
    private treeViewRefreshService: TreeviewRefreshService,
  ) {}
}
