
import { inject, Injectable } from '@angular/core';
import { of } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { TreeviewRefreshService } from '../../../main/project/dataset/treeview/service/treeview-refresh.service';
import { AppState } from '../app-state.model';
import { TabsActions } from '../ruleSets/tabs.action';
import { ProjectActions } from './project.action';
import { filterOutNullish, retryWithDelay } from '../../utils/rxjsUtils';
import { activeProjectSelector, selectFirstDataSetFromTree, selectTreeDataRefreshTrigger } from './project.selectors';
import { generateNgrxKey } from '../v2Tabs/utils';
import { V2CurrentTabAction } from '../v2CurrentTab/v2CurrentTab.action';
import { TreeNode } from '../../../main/project/dataset/treeview/types';
import { selectCurrentV2Tab } from '../v2Tabs/v2Tabs.selectors';
import { V2TabsActions } from '../v2Tabs/v2Tabs.action';

@Injectable()
export class ProjectEffects {
  private actions = inject(Actions)
  private treeRefreshService = inject(TreeviewRefreshService)
  private store = inject(Store<AppState>);

  setActiveProject = createEffect(() => {
    return this.actions.pipe(
      ofType(ProjectActions.setActiveProject),
      switchMap((action) => {
        return of(ProjectActions.setActiveProjectComplete({ activeProject: action.activeProject }))
      }),
    );
  });


  clearOldTabsWhenNewProjectIsSet = createEffect(() => {
    return this.actions.pipe(
      ofType(ProjectActions.setActiveProject),
      switchMap(() => of(TabsActions.clearTabs()))
    );
  });

  triggerOpenFirstDataSetWhenTreeDataIsReady = createEffect(() => {
    return this.actions.pipe(
      ofType(ProjectActions.loadTreeDataSuccess),
      withLatestFrom(
        this.store.select(activeProjectSelector).pipe(filterOutNullish()),
        this.store.select(selectFirstDataSetFromTree).pipe(filterOutNullish()),
        this.store.select(selectTreeDataRefreshTrigger).pipe(filterOutNullish())
      ),
      filter(([action, activeProject, firstDataSet, refreshCounter]) => {
        return refreshCounter === 1
      }),
      map(([action, activeProject, firstDataSet]) => {
        return firstDataSet;
      }),
      filterOutNullish(),
      switchMap((dataSet) => {
        return of(ProjectActions.openFirstDataSetInProject())
      })
    );
  });

  openFirstDataSetInProject = createEffect(() =>
    this.actions.pipe(
      ofType(ProjectActions.openFirstDataSetInProject),
      withLatestFrom(
        this.store.select(selectFirstDataSetFromTree).pipe(filterOutNullish()),
      ),
      map(([action, firstDataSet]) => {
        return { ids: firstDataSet.ids, text: firstDataSet.text }
      }),
      mergeMap(({ ids, text }) => {
        const description = '';
        const dataSet = this.treeRefreshService.createDataSetObject(ids, text, description);
        return of(TabsActions.addDataSet({ tab: dataSet, text: text, description, datasetText: '', ids }));
      })
    )
  );

  addExpandedNodesOnAddTab = createEffect(() =>
    this.actions.pipe(
      ofType(V2TabsActions.addTab),
      withLatestFrom(
        this.store.select(selectCurrentV2Tab).pipe(filterOutNullish()),
      ),
      filter(([action, v2Tab]) => {
        const type = v2Tab.type;
        return type !== 'process'
      }),
      map(([action, v2Tab]) => {
        const node: TreeNode = { ids: v2Tab.ids, type: v2Tab.type };
        return node;
      }),
      mergeMap((node) => {
        return of(ProjectActions.addExpandedNode({ node }));
      })
    )
  );


  setCurrentTabAfterOpeningFirstDataSet = createEffect(() =>
    this.actions.pipe(
      ofType(ProjectActions.openFirstDataSetInProject),
      withLatestFrom(
        this.store.select(selectFirstDataSetFromTree).pipe(filterOutNullish()),
      ),
      map(([action, firstDataSet]) => {
        return { ids: firstDataSet.ids, text: firstDataSet.text }
      }),
      mergeMap(({ ids, text }) => {
        const ngrxKey = generateNgrxKey(ids.projectId!, ids.dataSetId!, ids.ruleSetId!, 0, 'dataSet');
        return of(V2CurrentTabAction.setCurrentTab({ currentTab: ngrxKey }));
      })
    )
  );

  syncTreeServiceAndSignalRefresh$ = createEffect(() =>
    this.actions.pipe(
      ofType(ProjectActions.setActiveProjectComplete),
      mergeMap(() => {
        return of(ProjectActions.signalTreeDataRefresh());
      })
    )
  );


  loadTreeDataOnSignal$ = createEffect(() =>
    this.actions.pipe(
      ofType(ProjectActions.signalTreeDataRefresh),
      withLatestFrom(this.store.select(activeProjectSelector)),
      filter(([action, activeProject]) => !!activeProject?.id),
      map(([action, activeProject]) =>
        ProjectActions.loadTreeData({ projectId: activeProject!.id! })
      )
    )
  );

  fetchTreeData$ = createEffect(() =>
    this.actions.pipe(
      ofType(ProjectActions.loadTreeData),
      mergeMap(action =>
        this.treeRefreshService.getTreeItems(action.projectId).pipe(
          retryWithDelay(1000, 3),
          map(treeData => ProjectActions.loadTreeDataSuccess({ treeData })),
          catchError(error => of(ProjectActions.loadTreeDataFailure({ error })))
        )
      )
    )
  );

}



