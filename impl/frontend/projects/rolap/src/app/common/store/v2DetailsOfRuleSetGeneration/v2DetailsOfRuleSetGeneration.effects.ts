import { Injectable } from '@angular/core';

import { filterOutNullish } from '../../utils/rxjsUtils';
import { EMPTY, exhaustMap, map, mergeMap, of, switchMap, withLatestFrom } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { ProjectService } from '../../../main/project/service/project.service';
import { RuleSetApiService } from '../../services/rule-set/rule-set-api.service';
import { AppState } from '../app-state.model';
import {
  predictionIndicatorsRefreshAllChange,
  predictionIndicatorsTestDataRefresh,
  predictionIndicatorsTrainingDataRefresh,
  ruleSetPredictionIndicatorsRefreshChange,
} from '../ruleSets/rulesets.action';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { generateNgrxKey, isRuleSet } from '../v2Tabs/utils';
import { V2TabsActions } from '../v2Tabs/v2Tabs.action';
import { selectCurrentV2TabIds } from '../v2Tabs/v2Tabs.selectors';
import { V2DetailsOfRuleSetGenerationActions } from './v2DetailsOfRuleSetGeneration.action';

@Injectable()
export class V2DetailsOfRuleSetGenerationEffects {
  //When we add ruleset we want to load details of ruleset generation
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
        return this.ruleSetApiService.getRulesetDetails(dataSetId, ruleSetId).pipe(
          switchMap((table) => {
            if (table.algorithm === null)
              return of({
                id,
                table,
                algoName: null,
              });
            return this.projectService.getAlgorithmParams(table.algorithm).pipe(
              map((params) => {
                const algoName = params.name || null;
                return { id, table, algoName };
              }),
            );
          }),
          switchMap((details) => {
            return of(V2DetailsOfRuleSetGenerationActions.add({ details }));
          }),
        );
      }),
    );
  });

  //When we remove all v2Tabs we want to remove
  removeAllTabs = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.closeAllTabs),
      exhaustMap(() => of(V2DetailsOfRuleSetGenerationActions.removeAll())),
    ),
  );

  //When we remove tab that uses classify we want to remove
  removeTab = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.removeTab),
      exhaustMap((action) => {
        const key = action.key;
        return of(V2DetailsOfRuleSetGenerationActions.remove({ key }));
      }),
    ),
  );

  setPredictionConfig = createEffect(() =>
    this.actions$.pipe(
      ofType(V2DetailsOfRuleSetGenerationActions.setPredictionConfig),
      withLatestFrom(this.store$.select(selectCurrentV2TabId)),
      mergeMap(([action, currentTabId]) => {
        const key = currentTabId;
        return of(
          V2DetailsOfRuleSetGenerationActions.setPreditionConfigComplete({
            key,
            predictionConfig: action.predictionConfig,
          }),
        );
      }),
    ),
  );

  setRefreshAllWhenPredictionConfigChange = createEffect(() =>
    this.actions$.pipe(
      ofType(V2DetailsOfRuleSetGenerationActions.setPredictionConfig),
      withLatestFrom(this.store$.select(selectCurrentV2TabIds).pipe(filterOutNullish())),
      mergeMap(([action, ids]) => {
        return of(predictionIndicatorsRefreshAllChange({ ids, refreshAll: 'clickable' }));
      }),
    ),
  );

  //when user changes the resolution method, we need to set ruleSetPredictionIndicatorsRefreshChange to true
  ruleSetPredictionIndicatorsRefreshChange = createEffect(() =>
    this.actions$.pipe(
      ofType(V2DetailsOfRuleSetGenerationActions.setPreditionConfigComplete),
      withLatestFrom(this.store$.select(selectCurrentV2TabIds).pipe(filterOutNullish())),
      mergeMap(([action, ids]) => {
        return of(ruleSetPredictionIndicatorsRefreshChange({ ids, needsRefresh: true }));
      }),
    ),
  );

  //when user changes the resolution method, we need to set ruleSetPredictionIndicatorsRefreshChange to true
  predictionIndicatorsTrainingDataRefresh = createEffect(() =>
    this.actions$.pipe(
      ofType(V2DetailsOfRuleSetGenerationActions.setPreditionConfigComplete),
      withLatestFrom(this.store$.select(selectCurrentV2TabIds).pipe(filterOutNullish())),
      mergeMap(([action, ids]) => {
        return of(predictionIndicatorsTrainingDataRefresh({ ids, needsRefresh: true }));
      }),
    ),
  );

  //when user changes the resolution method, we need to set predictionIndicatorsTestDataRefresh to true
  predictionIndicatorsTestDataRefresh = createEffect(() =>
    this.actions$.pipe(
      ofType(V2DetailsOfRuleSetGenerationActions.setPreditionConfigComplete),
      withLatestFrom(this.store$.select(selectCurrentV2TabIds).pipe(filterOutNullish())),
      mergeMap(([action, ids]) => {
        return of(predictionIndicatorsTestDataRefresh({ ids, needsRefresh: true }));
      }),
    ),
  );

  // when user changes the resolution method, we need to set isSaved to false
  setIsSaved = createEffect(() =>
    this.actions$.pipe(
      ofType(V2DetailsOfRuleSetGenerationActions.setPreditionConfigComplete),
      exhaustMap(() => {
        return of(V2TabsActions.setIsSaved({ isSaved: false }));
      }),
    ),
  );

  constructor(
    private store$: Store<AppState>,
    private actions$: Actions,
    private projectService: ProjectService,
    private ruleSetApiService: RuleSetApiService,
  ) {}
}
