import { Injectable } from '@angular/core';

import { of } from 'rxjs';
import { mergeMap, withLatestFrom } from 'rxjs/operators';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { AppState } from '../app-state.model';
import { ProjectSearchActions } from './projectSearch.action';
import { selectProjectSearch } from './projectSearch.selector';
import { sortTypes } from './projectSearch.types';

@Injectable()
export class ProjectSearchEffects {
  setSortProjects$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectSearchActions.setSortProjects),
      withLatestFrom(this.store.select(selectProjectSearch)),
      mergeMap(([action, projectSearch]) => {
        if (projectSearch.sortField === action.field) {
          const sortType = projectSearch.sortType === sortTypes.ASC ? sortTypes.DESC : sortTypes.ASC;
          return of(ProjectSearchActions.setSortProjectsComplete({ field: action.field, sortType: sortType }));
        }
        return of(ProjectSearchActions.setSortProjectsComplete({ field: action.field, sortType: sortTypes.ASC }));
      }),
    ),
  );

  constructor(private actions$: Actions, private store: Store<AppState>) {}
}
