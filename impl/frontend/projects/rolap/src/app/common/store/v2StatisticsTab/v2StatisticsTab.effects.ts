import { Injectable } from '@angular/core';

import { exhaustMap, of, switchMap } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';

import { DatasetService } from '../../../main/project/dataset/service/dataset.service';
import { TabsActions } from '../ruleSets/tabs.action';
import { generateNgrxKey } from '../v2Tabs/utils';
import { V2TabsActions } from '../v2Tabs/v2Tabs.action';
import { V2StatisticsTab } from './types';
import { V2StatisticsTabActions } from './v2StatisticsTab.action';

@Injectable()
export class V2StatisticsTabEffects {
  loadDatasetStatistics = createEffect(() =>
    this.actions.pipe(
      ofType(TabsActions.addDataSet),
      exhaustMap((action) => {
        const dataSetId = action.ids.dataSetId as number;
        const projectId = action.ids.projectId as number;
        const ruleSetId = action.ids.ruleSetId as number;
        const id = generateNgrxKey(projectId, dataSetId, ruleSetId, 0, 'dataSet');

        return this.datasetService.getUnimportantAttributes(dataSetId).pipe(
          switchMap((res) => {
            const data: V2StatisticsTab = {
              id,
              unimportantAttributes: res,
            };

            return of(V2StatisticsTabActions.add({ statistics: data }));
          }),
        );
      }),
    ),
  );

  //When we remove all v2Tabs we want to remove all prediction subTabs
  removeAllTabs = createEffect(() =>
    this.actions.pipe(
      ofType(V2TabsActions.closeAllTabs),
      exhaustMap((action) => of(V2StatisticsTabActions.removeAll())),
    ),
  );

  //When we remove tab that uses classify we want to remove prediction subTab
  removeTab = createEffect(() =>
    this.actions.pipe(
      ofType(V2TabsActions.removeTab),
      exhaustMap((action) => {
        const key = action.key;
        return of(V2StatisticsTabActions.remove({ key }));
      }),
    ),
  );

  constructor(private actions: Actions, private datasetService: DatasetService) {}
}
