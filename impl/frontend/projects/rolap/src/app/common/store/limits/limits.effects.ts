import { Injectable } from '@angular/core';

import { map, switchMap } from 'rxjs';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { AccountService } from '../../../main/project/service/account.service';
import { AppState } from '../app-state.model';
import { AccountUsageLimits } from './limits.action';

@Injectable()
export class LimitsEffects {
  loadLimits$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AccountUsageLimits.loadLimits),
      switchMap(() => {
        return this.accountService.getUserLimits().pipe(map((limits) => AccountUsageLimits.setLimits({ limits })));
      }),
    );
  });

  constructor(private actions$: Actions, private store: Store<AppState>, private accountService: AccountService) {}
}
