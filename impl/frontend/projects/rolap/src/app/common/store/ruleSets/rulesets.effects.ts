import { Injectable } from '@angular/core';

import { forkJoin, of } from 'rxjs';
import { concatMap, delay, exhaustMap, filter, map, switchMap, takeUntil } from 'rxjs/operators';

import { Actions, createEffect, ofType } from '@ngrx/effects';

import { DatasetService } from '../../../main/project/dataset/service/dataset.service';
import { ProjectService } from '../../../main/project/service/project.service';
import { RefreshAllState } from '../app-state.model';
import { generateNgrxKey } from '../v2Tabs/utils';
import {
  loadDatasetStatistics,
  loadPredictionCrossValidation,
  loadPredictionIndicators,
  loadRuleAttributesAndConditionImportance,
  loadRulePredictionIndicators,
  loadRuleQuantitativeCharacteristics,
  prefetchRulePredictionIndicators,
  rulesRefreshAllChange,
  setIsLoadingPredictionIndicators,
  setIsLoadingQuantitativeCharacteristics,
  setIsLoadingRuleAttributesAndConditionImportance,
} from './rulesets.action';
import { Ids } from './rulesets.selectors';
import { TabsActions } from './tabs.action';

@Injectable()
export class TabsEffects {
  setIsLoadingRuleAttributesAndConditionImportance = createEffect(() => {
    return this.actions.pipe(
      ofType(loadRuleAttributesAndConditionImportance),
      exhaustMap((action: { data: { ids: Ids; data: any } }) => {
        return of(action.data.ids);
      }),
      concatMap((ids) => of(setIsLoadingRuleAttributesAndConditionImportance({ ids, isLoading: false }))),
    );
  });

  setIsLoadingPredictionIndicators = createEffect(() => {
    return this.actions.pipe(
      ofType(loadPredictionIndicators),
      exhaustMap((action: { data: { ids: Ids; data: any } }) => {
        return of(action.data.ids);
      }),
      concatMap((ids) => of(setIsLoadingPredictionIndicators({ ids, isLoading: false }))),
    );
  });

  setIsLoadingQuantitativeCharacteristics = createEffect(() => {
    return this.actions.pipe(
      ofType(loadRuleQuantitativeCharacteristics),
      exhaustMap((action: { data: { ids: Ids; data: any } }) => {
        return of(action.data.ids);
      }),
      concatMap((ids) => of(setIsLoadingQuantitativeCharacteristics({ ids, isLoading: false }))),
    );
  });

  prefetchRulePredictionIndicators = createEffect(() => {
    return this.actions.pipe(
      ofType(TabsActions.addRuleSet),
      exhaustMap((action) => {
        const dataSetId = action.ids.dataSetId as number;
        const ruleSetId = action.ids.ruleSetId as number;
        const projectId = action.ids.projectId as number;
        const ids: Ids = { ruleSetId, dataSetId, projectId };
        return this.projectService
          .getPredictionIndicators(dataSetId, ruleSetId)
          .pipe(map((indicators) => prefetchRulePredictionIndicators({ indicators, ids })));
      }),
    );
  });

  loadRulePredictionIndicators = createEffect(() => {
    return this.actions.pipe(
      ofType(prefetchRulePredictionIndicators),
      map((action) => {
        const ids: Ids = action.data.ids;
        const predictionIndicators = { ...action.data.indicators.general };
        delete predictionIndicators['Confusion_matrix'];
        return loadRulePredictionIndicators({ data: predictionIndicators, ids });
      }),
    );
  });
  loadRuleQuantitativeCharacteristics = createEffect(() => {
    return this.actions.pipe(
      ofType(TabsActions.addRuleSet),
      exhaustMap((action) => {
        const dataSetId = action.ids.dataSetId as number;
        const ruleSetId = action.ids.ruleSetId as number;
        const projectId = action.ids.projectId as number;
        const ids: Ids = { ruleSetId, dataSetId, projectId };
        return this.projectService
          .getQuantitativeCharacteristics(dataSetId, ruleSetId)
          .pipe(map((data) => loadRuleQuantitativeCharacteristics({ data, ids })));
      }),
    );
  });
  loadRuleAttributesAndConditionImportance = createEffect(() => {
    return this.actions.pipe(
      ofType(TabsActions.addRuleSet),
      exhaustMap((action) => {
        const ruleSetId = action.ids.ruleSetId as number;
        const dataSetId = action.ids.dataSetId as number;
        const ids = action.ids;
        return this.projectService
          .getRulesImportance(dataSetId, ruleSetId)
          .pipe(map((data: any) => loadRuleAttributesAndConditionImportance({ ids, data })));
      }),
    );
  });
  loadPredictionIndicators = createEffect(() => {
    return this.actions.pipe(
      ofType(prefetchRulePredictionIndicators),
      map((action) => {
        return loadPredictionIndicators({ data: action.data.indicators.for_classes, ids: action.data.ids });
      }),
    );
  });
  loadPredictionCrossValidation = createEffect(() => {
    return this.actions.pipe(
      ofType(TabsActions.addRuleSet),
      exhaustMap((action) => {
        const ruleSetId = action.ids.ruleSetId as number;
        const dataSetId = action.ids.dataSetId as number;
        const projectId = action.ids.projectId as number;
        const v2TabId = generateNgrxKey(projectId, dataSetId, ruleSetId, 0, 'ruleSet');
        return this.projectService.getCrossValidation(dataSetId, ruleSetId).pipe(
          filter((response: any) => response !== null && response.result !== null),
          map((response: any) => {
            const table = Object.keys(response.result).map((key) => ({
              name: key,
              ...response.result[key],
            }));
            const numOfFolds = response.num_folds || null;
            return { table, numOfFolds };
          }),
          map((data: any) => loadPredictionCrossValidation({ data, v2TabId })),
        );
      }),
    );
  });
  loadDatasetStatistic = createEffect(() => {
    return this.actions.pipe(
      ofType(TabsActions.addDataSet),
      exhaustMap((action) => {
        const dataSetId = action.ids.dataSetId as number;
        const projectId = action.ids.projectId as number;
        const ruleSetId = action.ids.ruleSetId as number;
        return forkJoin({
          statistic: this.datasetService.getDatasetStatistic(dataSetId),
          attributes: this.datasetService.getAttributesForDataset(dataSetId),
        }).pipe(
          map(({ statistic, attributes }) => {
            const v2TabId = generateNgrxKey(projectId, dataSetId, ruleSetId, 0, 'dataSet');
            return loadDatasetStatistics({ data: { ...statistic, attributes: { ...attributes } }, v2TabId });
          }),
        );
      }),
    );
  });

  // This effect triggers when `rulesRefreshAllChange` is called with refreshAll = 'success'.
  // It waits 4 seconds, then dispatches another `rulesRefreshAllChange` to set refreshAll = 'success',
  // provided that no new `rulesRefreshAllChange` with `success` arrives in the meantime.
  updateRefreshAllEffect = createEffect(() =>
    this.actions.pipe(
      ofType(rulesRefreshAllChange),
      filter((action) => action.data.refreshAll === RefreshAllState.SUCCESS),
      // switchMap will cancel the previous subscription if a new action arrives
      switchMap((action) => {
        const { ids } = action.data;
        // Wait for 4 seconds before dispatching the 'success' action
        return of(action).pipe(
          delay(4000),
          map(() => rulesRefreshAllChange({ ids, refreshAll: RefreshAllState.HIDDEN })),
          // If another rulesRefreshAllChange with success arrives before delay is over,
          // it cancels this one and restarts the timer.
          takeUntil(
            this.actions.pipe(
              ofType(rulesRefreshAllChange),
              // If a new `success` event arrives, it cancels this one.
              filter(
                (newAction) =>
                  newAction.data.refreshAll === RefreshAllState.SUCCESS &&
                  newAction.data.ids.ruleSetId === ids.ruleSetId &&
                  newAction.data.ids.dataSetId === ids.dataSetId &&
                  newAction.data.ids.projectId === ids.projectId,
              ),
            ),
          ),
        );
      }),
    ),
  );

  constructor(
    private actions: Actions,
    private projectService: ProjectService,
    private datasetService: DatasetService,
  ) {}
}
