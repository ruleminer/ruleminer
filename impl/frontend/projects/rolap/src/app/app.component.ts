import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { filterOutNullish } from './common/utils/rxjsUtils';
import { filter, map, switchMap, take } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { loadMessages, locale } from 'devextreme/localization';
import * as enMessages from 'node_modules/devextreme/localization/messages/en.json';
import * as plMessages from 'projects/rolap/src/assets/devextreme-messages/pl.json';

import { getDefaultLanguage } from './app-config';
import { OpenTourComponent } from './common/components/tour/open-tour/open-tour.component';
import { TourApiService } from './common/components/tour/tour-api.service';
import { TourService } from './common/components/tour/tour.service';
import { ModalRef } from './common/services/modal/modal-ref';
import { ModalConfig, ModalPositions, ModalService } from './common/services/modal/modal.service';
import { NavigationService } from './common/services/navigation.service';
import { AppState } from './common/store/app-state.model';
import { TourActions } from './common/store/tour/tour.action';
import { selectCurrentStepIndex, selectIsTourActive } from './common/store/tour/tour.selectors';
import { ProfileService } from './main/profile/service/profile.service';

@Component({
  selector: 'rolap-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private tourService = inject(TourService);
  private profileService = inject(ProfileService);
  private translate = inject(TranslateService);
  private modalService = inject(ModalService);
  private store = inject(Store<AppState>);
  private tourApiService = inject(TourApiService);
  private destroyRef = inject(DestroyRef);
  private readonly navigationService = inject(NavigationService); // For navigation handling Do not remove this line

  private isTourActiveSignal = this.store.selectSignal(selectIsTourActive);
  private tourHandled = false;

  ngOnInit(): void {
    if (!this.tourHandled) {
      this.tourApiService
        .getCompletedTours()
        .pipe(take(1), takeUntilDestroyed(this.destroyRef))
        .subscribe((completedTours) => {
          if (completedTours.length === 0) {
            this.tourHandled = true;
            this.handleTourLogic();
          }
        });
    }

    this.setupAppLanguage();
    this.devextremeLangChange(this.translate.currentLang);
    this.observeLangChange();
  }

  private handleTourLogic(): void {
    const isTourActive = this.isTourActiveSignal();
    if (isTourActive) {
      this.store
        .select(selectCurrentStepIndex)
        .pipe(filterOutNullish(), take(1), takeUntilDestroyed(this.destroyRef))
        .subscribe((currentStepIndex) => {
          this.tourService.startTour(currentStepIndex);
        });
    } else {
      // Only show tour modal on home route
      const currentUrl = this.router.url;
      if (currentUrl === '/home' || currentUrl === '/') {
        setTimeout(() => this.openTourModal(), 500);
      }
    }
  }

  private setupAppLanguage() {
    const savedLanguage = localStorage.getItem('lang');

    if (savedLanguage) {
      this.translate.use(savedLanguage);
    }

    this.profileService
      .getUserLanguage()
      .pipe(
        map((lang) => lang.preferred_language),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((userLang) => {
        const language = userLang || getDefaultLanguage(this.translate);

        if (language !== savedLanguage) {
          this.translate.use(language);
          localStorage.setItem('lang', language);
        }
      });
  }

  private observeLangChange() {
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.devextremeLangChange(res.lang));
  }

  private devextremeLangChange(langCode: string) {
    const messages = langCode === 'pl' ? plMessages : enMessages;
    loadMessages(messages);
    locale(langCode);
  }

  private openTourModal() {
    const route = this.router.url;
    if (route !== '/home' && route !== '/') return;

    const config: ModalConfig = {
      closeOnBackdropClick: true,
      position: ModalPositions.CENTER,
      closeOnEscapeClick: false,
    };

    this.modalService
      .open(OpenTourComponent, 'tour.config.title', '400px', undefined, null, config, null, true, () => {
        this.store.dispatch(TourActions.completeTour());
      })
      .pipe(
        switchMap((modalRef: ModalRef<OpenTourComponent>) => {
          return modalRef.getResult();
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filter((res: any) => res === true), // Proceed only if the result is true
        switchMap(() => this.store.select(selectCurrentStepIndex).pipe(filterOutNullish(), take(1))),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((currentStepIndex) => {
        this.tourService.startTour(currentStepIndex);
      });
  }
}
