import { Injectable, inject } from '@angular/core';

import { filterOutNullish } from '../../utils/rxjsUtils';
import { exhaustMap, mergeMap, of, withLatestFrom } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';

import { AppState } from '../app-state.model';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { V2TabsActions } from '../v2Tabs/v2Tabs.action';
import { V2PredictionTabActions } from './v2PredictionTab.action';
import { selectV2PredictionSelectedDatasetId } from './v2PredictionTab.selectors';

@Injectable()
export class V2PredictionTabEffects {
  private actions$ = inject(Actions);
  private store = inject(Store<AppState>);

  setCurrentDatasetId = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2PredictionTabActions.set),
      withLatestFrom(this.store.pipe(select(selectCurrentV2TabId))),
      mergeMap(([action, key]) => {
        return of(
          V2PredictionTabActions.setComplete({ currentTabId: key, selectedDatasetId: action.selectedDatasetId }),
        );
      }),
    );
  });

  setVisibleDatasetId = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2PredictionTabActions.setVisibleDataset),

      withLatestFrom(
        this.store.select(selectCurrentV2TabId),
        this.store.select(selectV2PredictionSelectedDatasetId).pipe(filterOutNullish()),
      ),
      mergeMap(([action, key, datasetId]) => {
        return of(
          V2PredictionTabActions.setVisibleDatasetComplete({
            currentTabId: key,
            selectedDatasetId: datasetId,
          }),
        );
      }),
    );
  });

  updateCurrentDatasetId = createEffect(() => {
    return this.actions$.pipe(
      ofType(V2PredictionTabActions.updateSelectedDatasetID),
      withLatestFrom(this.store.select(selectCurrentV2TabId)),
      mergeMap(([action, key]) => {
        return of(
          V2PredictionTabActions.updateSelectedDatasetIDComplete({
            currentTabId: key,
            selectedDatasetId: action.selectedDatasetId,
          }),
        );
      }),
    );
  });

  removeAllTabs = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.closeAllTabs),
      exhaustMap((action) => of(V2PredictionTabActions.removeAll())),
    ),
  );

  removeTab = createEffect(() =>
    this.actions$.pipe(
      ofType(V2TabsActions.removeTab),
      exhaustMap((action) => {
        const key = action.key;
        return of(V2PredictionTabActions.remove({ currentTabId: key }));
      }),
    ),
  );
}
