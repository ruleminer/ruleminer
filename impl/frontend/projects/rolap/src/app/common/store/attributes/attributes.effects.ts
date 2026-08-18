import { Injectable } from '@angular/core';

import { EMPTY, concatMap, exhaustMap, forkJoin, of } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';

import { DatasetService } from '../../../main/project/dataset/service/dataset.service';
import { generateNgrxKey, isRuleSet } from '../v2Tabs/utils';
import { V2TabsActions } from '../v2Tabs/v2Tabs.action';
import { AttributesActions } from './attributes.action';

@Injectable()
export class AttributesEffects {
  constructor(private actions$: Actions, private datasetService: DatasetService) {}

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

        return forkJoin({
          data: this.datasetService.getAttributesForDataset(dataSetId),
          minMaxValues: this.datasetService.getAttributesMinMaxValues(dataSetId),
        }).pipe(
          concatMap(({ data, minMaxValues }) => {
            return of(AttributesActions.add({ attributes: { id, data, minMaxValues } }));
          }),
        );
      }),
    ),
  );

  removeAllTabs = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.closeAllTabs),
      exhaustMap(() => of(AttributesActions.removeAll())),
    ),
  );

  removeTab = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.removeTab),
      exhaustMap((action) => {
        const key = action.key;
        return of(AttributesActions.remove({ key }));
      }),
    ),
  );
}
