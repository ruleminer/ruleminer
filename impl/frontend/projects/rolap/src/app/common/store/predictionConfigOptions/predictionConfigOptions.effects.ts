import { Injectable } from '@angular/core';

import { filterOutNullish } from '../../utils/rxjsUtils';
import { concatMap, filter, mergeMap, of, withLatestFrom } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';

import { PredictionConfigService } from '../../services/prediction-config.service';
import { AppState } from '../app-state.model';
import { AuthActions } from '../auth/auth.action';
import { ProjectActions } from '../project/project.action';
import { activeProjectSelector } from '../project/project.selectors';
import { storeVersionNumberSelector } from '../version/version.selectors';
import { PredictionConfigOptionsActions } from './predictionConfigOptions.actions';

@Injectable()
export class PredictionConfigOptionsEffects {
  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private predictionConfigService: PredictionConfigService,
  ) {}

  // Fetch prediction configuration options from the API when changing the active project (varies by project type)
  fetchOptions = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.setActiveProjectComplete, AuthActions.initialized),
      withLatestFrom(
        this.store$.pipe(select(storeVersionNumberSelector), filterOutNullish()),
        this.store$.pipe(select(activeProjectSelector), filterOutNullish()),
      ),
      filter(([action, versionNumber, activeProject]) => {
        // if version number is less than 3, we don't have this data in store and need to fetch it
        // we always want to fetch it when changing active project
        return versionNumber < 3 || action.type === ProjectActions.setActiveProjectComplete.type;
      }),
      mergeMap(([action, versionNumber, activeProject]) => {
        return this.predictionConfigService
          .getPredictionConfigOptions(activeProject.id)
          .pipe(concatMap((options) => of(PredictionConfigOptionsActions.setOptions({ options }))));
      }),
    ),
  );
}
