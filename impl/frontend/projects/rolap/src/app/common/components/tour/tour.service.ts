import { ApplicationRef, ComponentRef, DestroyRef, Injectable, createComponent, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { filterOutNullish } from '../../utils/rxjsUtils';
import { combineLatest, of } from 'rxjs';
import { catchError, filter, take, timeout } from 'rxjs/operators';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { environment } from '../../../../environments/environment';
import { ModalService } from '../../services/modal/modal.service';
import { NotifyService } from '../../services/notify/notify.service';
import { AppState } from '../../store/app-state.model';
import { setSidebarVisibility, setSidebarWidth } from '../../store/sidebar/sidebar.action';
import { TourActions } from '../../store/tour/tour.action';
import { selectCurrentStepIndex, selectIsTourActive, selectRoute } from '../../store/tour/tour.selectors';
import { HighlightOverlayService } from './shadow-element/highlight-overlay.service';
import { TourApiService } from './tour-api.service';
import { tourSteps } from './tour-steps';
import { TourComponent } from './tour.component';
import { TourStep } from './types';
import { getPositionStyle, waitForElement } from './utils';

@Injectable({
  providedIn: 'root',
})
export class TourService {
  private componentRef?: ComponentRef<TourComponent>;
  private appRef = inject(ApplicationRef);
  private modalService = inject(ModalService);
  private store = inject(Store<AppState>);
  private router = inject(Router);
  private notifyService = inject(NotifyService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private highlightOverlayService = inject(HighlightOverlayService);
  private tourApiService = inject(TourApiService);
  public route = toSignal(this.store.select(selectRoute).pipe(filterOutNullish(), take(1)));

  public steps: TourStep[] = tourSteps(this.router, this.modalService, this.store);

  private positionUpdateTimeoutId: number | undefined;
  private activeCleanupFunctions: (() => void)[] = [];
  private autoCancelTimer: number | undefined;
  private notificationDelayTimer: number | undefined;
  private isNotificationShown = false;
  private readonly AUTO_CANCEL_TIMEOUT = 10000; // 10 seconds
  private readonly NOTIFICATION_DELAY = 2000; // 2 seconds

  public startTour(currentStepIndex: number) {
    this.setDefaultSidebarValue();
    const steps = this.getSteps();
    const currentStep = steps[currentStepIndex];

    if (this.componentRef) {
      this.destroyTour();
    }

    this.componentRef = createComponent(TourComponent, {
      environmentInjector: this.appRef.injector,
    });
    this.appRef.attachView(this.componentRef.hostView);
    document.body.appendChild(this.componentRef.location.nativeElement);

    this.store.dispatch(TourActions.startTour());

    currentStep.isViewLoaded(currentStep.element).subscribe((data) => {
      if (!data) return;

      const waitForTourReady = combineLatest([
        waitForElement(currentStep.element),
        this.store.select(selectIsTourActive),
      ]).pipe(
        timeout(3000),
        catchError(() => of([null, false] as [HTMLElement | null, boolean])),
        take(1),
      );

      waitForTourReady.subscribe(([element, isActive]) => {
        if (!element || !isActive) {
          this.startDelayedNotification();
          return;
        }

        this.clearDelayedNotification();
        this.clearAutoCancelTimer();

        this.highlightOverlayService.highlightElement(element);
        this.store.dispatch(TourActions.setStepReady({ isStepReady: true }));
      });
    });

    combineLatest([this.store.select(selectIsTourActive), this.store.select(selectCurrentStepIndex)])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(([isActive]) => isActive),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([, index]) => {
        const currentStep = steps[index];
        waitForElement(currentStep.element)
          .pipe(
            timeout(3000),
            catchError(() => of(null)),
            take(1),
          )
          .subscribe((element) => {
            if (!element) {
              this.startDelayedNotification();
              return;
            }

            this.clearDelayedNotification();
            this.clearAutoCancelTimer();

            this.highlightOverlayService.highlightElement(element);

            this.updateTourPosition(currentStep, element);

            this.setupPositionTracking(currentStep, element);
          });
      });
  }

  private destroyTour() {
    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
      this.componentRef = undefined;
    }
  }

  public stopTour() {
    this.store.dispatch(TourActions.stopTour());

    this.clearDelayedNotification();
    this.clearAutoCancelTimer();

    this.cleanupPositionTracking();

    this.highlightOverlayService.closeOverlay();
    this.destroyTour();
    this.store.dispatch(TourActions.setStepReady({ isStepReady: false }));
  }

  public getSteps(): TourStep[] {
    return this.steps;
  }
  private setDefaultSidebarValue() {
    this.store.dispatch(
      setSidebarWidth({
        width: environment.sidebarWidth,
        previous: environment.closedSidebarWidth,
      }),
    );
    this.store.dispatch(setSidebarVisibility(true));
  }

  private updateTourPosition(step: TourStep, element: HTMLElement): void {
    if (this.positionUpdateTimeoutId) {
      clearTimeout(this.positionUpdateTimeoutId);
    }

    this.positionUpdateTimeoutId = window.setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const position = getPositionStyle(step, rect);
      this.store.dispatch(TourActions.setCurrentPositionComplete({ currentPosition: position }));
    }, 16);
  }

  private setupPositionTracking(step: TourStep, element: HTMLElement): void {
    this.cleanupPositionTracking();

    const updatePosition = () => {
      this.updateTourPosition(step, element);
    };

    const addListenerToElement = (el: Element | Window, event: string) => {
      el.addEventListener(event, updatePosition, { passive: true });
      return () => el.removeEventListener(event, updatePosition);
    };

    this.activeCleanupFunctions.push(addListenerToElement(window, 'resize'));
    this.activeCleanupFunctions.push(addListenerToElement(window, 'scroll'));

    const modalContainers = document.querySelectorAll('.cdk-overlay-pane, .modal-content, [role="dialog"]');
    modalContainers.forEach((container) => {
      this.activeCleanupFunctions.push(addListenerToElement(container, 'scroll'));
    });

    const scrollableContainers = document.querySelectorAll('[data-scrollable], .dx-scrollable-container');
    scrollableContainers.forEach((container) => {
      this.activeCleanupFunctions.push(addListenerToElement(container, 'scroll'));
    });

    this.store
      .select(selectIsTourActive)
      .pipe(
        filter((isActive) => !isActive),
        take(1),
      )
      .subscribe(() => this.cleanupPositionTracking());
  }

  private cleanupPositionTracking(): void {
    if (this.positionUpdateTimeoutId) {
      clearTimeout(this.positionUpdateTimeoutId);
      this.positionUpdateTimeoutId = undefined;
    }

    this.activeCleanupFunctions.forEach((cleanup) => cleanup());
    this.activeCleanupFunctions = [];
  }

  private startAutoCancelTimer(): void {
    this.clearAutoCancelTimer();

    this.autoCancelTimer = window.setTimeout(() => {
      this.stopTour();
    }, this.AUTO_CANCEL_TIMEOUT);
  }

  private clearAutoCancelTimer(): void {
    if (this.autoCancelTimer) {
      clearTimeout(this.autoCancelTimer);
      this.autoCancelTimer = undefined;
    }
  }

  private startDelayedNotification(): void {
    this.clearDelayedNotification();
    this.clearAutoCancelTimer();

    this.notificationDelayTimer = window.setTimeout(() => {
      this.isNotificationShown = true;
      this.tourApiService.setCompletedTour().subscribe();
      this.notifyService.showNotify(this.translate.instant('tour.element_not_found'), 'error');
      this.startAutoCancelTimer();
    }, this.NOTIFICATION_DELAY);
  }

  private clearDelayedNotification(): void {
    if (this.notificationDelayTimer) {
      clearTimeout(this.notificationDelayTimer);
      this.notificationDelayTimer = undefined;
    }
    this.isNotificationShown = false;
  }

  public isElementNotFoundNotificationShown(): boolean {
    return this.isNotificationShown;
  }
}
