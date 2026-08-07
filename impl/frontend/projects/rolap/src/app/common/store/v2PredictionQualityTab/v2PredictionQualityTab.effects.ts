import { Injectable } from '@angular/core';

import { exhaustMap, forkJoin, map, of, switchMap } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { ProjectService } from '../../../main/project/service/project.service';
import { AppState } from '../app-state.model';
import { prefetchRulePredictionIndicators } from '../ruleSets/rulesets.action';
import { generateNgrxKey } from '../v2Tabs/utils';
import { V2TabsActions } from '../v2Tabs/v2Tabs.action';
import { V2PredictionQualityTab } from './types';
import { V2PredictionQualityTabActions } from './v2PredictionQualityTab.action';

@Injectable()
export class V2PredictionQualityTabEffects {
  //When we add ruleset we want to load one prediction subTab
  addRuleSet = createEffect(() =>
    this.actions$.pipe(
      ofType(prefetchRulePredictionIndicators),
      exhaustMap((action) => {
        const projectId = action.data.ids.projectId as number;
        const dataSetId = action.data.ids.dataSetId as number;
        const ruleSetId = action.data.ids.ruleSetId as number;
        const id = generateNgrxKey(projectId, dataSetId, ruleSetId, 0, 'ruleSet');
        const histogramData = action.data.indicators.histogram;
        return this.projectService.getCrossValidation(dataSetId, ruleSetId).pipe(
          map((response: any) => {
            if (!response || !response.result) return null;

            const table = Object.keys(response.result).map((key) => ({
              name: key,
              ...response.result[key],
            }));
            const numOfFolds = response.num_folds || null;
            return { table, numOfFolds };
          }),
          switchMap((crossValidation) => {
            return forkJoin({
              crossValidation: of(crossValidation),
              generalIndicators: this.projectService.getPredictionIndicators(dataSetId, ruleSetId).pipe(
                map((response) => {
                  if (!response) return {};
                  return response;
                }),
              ),
            });
          }),
          switchMap((data) => {
            const { crossValidation, generalIndicators } = data;
            const predictionTab: V2PredictionQualityTab = {
              id,
              histogram: histogramData,
              crossValidation: crossValidation,
              generalIndicators: generalIndicators,
            };

            return of(V2PredictionQualityTabActions.add({ prediction: predictionTab }));
          }),
        );
      }),
    ),
  );

  //When we remove all v2Tabs we want to remove all prediction subTabs
  removeAllTabs = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.closeAllTabs),
      exhaustMap((action) => of(V2PredictionQualityTabActions.removeAll())),
    ),
  );

  //When we remove tab that uses classify we want to remove prediction subTab
  removeTab = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.removeTab),
      exhaustMap((action) => {
        const key = action.key;
        return of(V2PredictionQualityTabActions.remove({ key }));
      }),
    ),
  );

  constructor(private actions$: Actions, private projectService: ProjectService, private store$: Store<AppState>) {}
}
