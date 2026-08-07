import { Injectable } from '@angular/core';

import { catchError, from, map, of, switchMap, withLatestFrom } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';
import { KeycloakService } from 'keycloak-angular';

import { AppState } from '../app-state.model';
import { AuthActions } from './auth.action';
import { selectUserId } from './auth.selector';

@Injectable()
export class AuthEffects {
  constructor(private actions$: Actions, private store: Store<AppState>, private keycloak: KeycloakService) {}

  // When auth is initialized, load the user profile
  loadUserProfileOnAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.initialized),
      map(() => AuthActions.loadUserProfile()),
    ),
  );

  loadUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserProfile),
      withLatestFrom(this.store.pipe(select(selectUserId))),
      switchMap(([_, currentStoreUserId]) =>
        from(this.keycloak.loadUserProfile()).pipe(
          switchMap((profile) => {
            const userId = profile.id || '';

            // If the user ID is different from what's in the store, clear the entire store state
            if (currentStoreUserId && currentStoreUserId !== userId) {
              this.store.dispatch(AuthActions.clearStore());
            }

            return of(AuthActions.userProfileLoaded({ userId }));
          }),
          catchError((error) => of(AuthActions.userProfileLoadError({ error }))),
        ),
      ),
    ),
  );
}
