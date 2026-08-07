import { Injectable } from '@angular/core';

import { EMPTY, concatMap, delay, filter, map, mergeMap, of, switchMap, take, tap, withLatestFrom } from 'rxjs';

import { Actions, ROOT_EFFECTS_INIT, createEffect, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'projects/rolap/src/environments/environment';

import packageJson from '../../../../../../../package.json';
import { NewStoreVersionModalComponent } from '../../components/new-store-version-modal/new-store-version-modal.component';
import { ModalRef } from '../../services/modal/modal-ref';
import { ModalService } from '../../services/modal/modal.service';
import { VersionService } from '../../services/version.service';
import { AppState } from '../app-state.model';
import { TabsActions } from '../ruleSets/tabs.action';
import { StoreVersionActions } from './version.action';
import { storeVersionNumberSelector } from './version.selectors';

@Injectable()
export class VersionEffect {
  /**
   * Check if store version needs to be updated.
   * If an update is required, open modal and clear tabs.
   * Otherwise, do nothing.
   */
  setVersionOnInit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      withLatestFrom(
        this.store.pipe(select(storeVersionNumberSelector)), // Get store version
      ),
      take(1),
      concatMap(([action, localStorageVersion]) => {
        const recentStoreVersion: number = packageJson.storeVersion;

        // On first start of application, the value of `localStorageVersion` is -1. In that case we don't show modal with message.
        if (localStorageVersion === -1) {
          return of(StoreVersionActions.setStoreVersionComplete({ version: recentStoreVersion }));
        }

        const needsUpdate = localStorageVersion !== recentStoreVersion;

        if (needsUpdate) return of(StoreVersionActions.openModalAndClearTabs());
        return EMPTY;
      }),
    ),
  );

  /**
   * Open modal, clear tabs, and set store version on modal close.
   */
  showModal$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoreVersionActions.openModalAndClearTabs),
      switchMap(() => {
        return this.translate.onDefaultLangChange.pipe(take(1));
      }),
      switchMap(() => {
        return this.modalService
          .open(NewStoreVersionModalComponent, this.translate.instant('new_store_version_modal.title'))
          .pipe(
            tap(() => {
              this.store.dispatch(TabsActions.clearTabs());
            }),
            switchMap((modalRef: ModalRef<NewStoreVersionModalComponent>) => modalRef.onClose()),
            switchMap(() => {
              const recentStoreVersion: number = packageJson.storeVersion;
              return of(StoreVersionActions.setStoreVersionComplete({ version: recentStoreVersion }));
            }),
          );
      }),
    );
  });

  printSystemVersionToConsole$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ROOT_EFFECTS_INIT),
        take(1),
        delay(1000),
        mergeMap(() => this.versionService.getSystemVersion()),
        filter(() => !environment.production),
        map((version) => {
          console.log(`%c RuleMiner v${version}`, 'background: #222; color: #bada55; font-weight: bold;');
        }),
      ),
    { dispatch: false },
  );

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private modalService: ModalService,
    private translate: TranslateService,
    private versionService: VersionService,
  ) {}
}
