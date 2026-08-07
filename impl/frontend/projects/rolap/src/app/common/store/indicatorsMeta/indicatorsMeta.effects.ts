import { Injectable, inject } from '@angular/core';

import { filter, map, of, switchMap, withLatestFrom } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { ProblemTypes } from '../../../main/data-upload/utils/enums';
import { IndicatorsMetaService } from '../../services/indicators-meta.service';
import { AppState } from '../app-state.model';
import { ProjectActions } from '../project/project.action';
import { activeProjectProblemTypeSelector } from '../project/project.selectors';
import { IndicatorsMetaActions } from './indicatorsMeta.actions';

@Injectable()
export class IndicatorsMetaEffects {
  private store = inject(Store<AppState>);
  private actions = inject(Actions);
  private indicatorsMetaService = inject(IndicatorsMetaService);

  fetchIndicatorsMetaData = createEffect(() =>
    this.actions.pipe(
      ofType(ProjectActions.setActiveProject),
      withLatestFrom(this.store.select(activeProjectProblemTypeSelector)),
      filter(([action, currentProblemType]) => {
        // indicators are being fetched for given problem type. If the ones in the store
        // are connected to the same problem_type as the new current project, then there
        // is no need to refetch them.
        return action.activeProject.type_of_problem !== currentProblemType;
      }),
      switchMap(([action, currentProblemType]) => {
        const projectProblemType: ProblemTypes = action.activeProject.type_of_problem;
        return this.indicatorsMetaService
          .getIndicatorsMetaData(projectProblemType)
          .pipe(map((indicatorsMeta) => ({ indicatorsMeta, problemType: projectProblemType })));
      }),
      switchMap(({ indicatorsMeta, problemType }) =>
        of(IndicatorsMetaActions.setIndicatorsMetadata({ indicatorsMeta, problemType })),
      ),
    ),
  );
}
