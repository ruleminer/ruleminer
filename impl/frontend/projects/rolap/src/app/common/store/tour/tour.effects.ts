import { Injectable, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';

import { EMPTY, of, timer } from 'rxjs';
import {
  catchError,
  delay,
  filter,
  map,
  mergeMap,
  switchMap,
  take,
  takeWhile,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { Actions, ROOT_EFFECTS_INIT, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { AccountService } from '../../../main/project/service/account.service';
import { HighlightOverlayService } from '../../components/tour/shadow-element/highlight-overlay.service';
import { TourApiService } from '../../components/tour/tour-api.service';
import { TourService } from '../../components/tour/tour.service';
import { getPositionStyle } from '../../components/tour/utils';
import { AppState } from '../app-state.model';
import { CustomActionTypes } from '../effects';
import { TourActions } from './tour.action';
import { selectCurrentStepIndex, selectIsTourActive, selectRoute } from './tour.selectors';

@Injectable()
export class TourEffects {
  private readonly actions$ = inject(Actions);
  private readonly router = inject(Router);
  private readonly tourService = inject(TourService);
  private readonly tourApiService = inject(TourApiService);
  private readonly highlighOverlayService = inject(HighlightOverlayService);
  private readonly accountService = inject(AccountService);
  private readonly store = inject(Store<AppState>);

  /**
   * Initializes the tour by handling the first navigation.
   * If tour is active and current route differs from target route,
   * redirects to the correct route.
   */
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      take(1),
      switchMap((_action) => {
        return this.router.events.pipe(
          filter((event) => {
            return event instanceof NavigationStart;
          }),
          take(1),
        );
      }),
      withLatestFrom(this.store.select(selectIsTourActive), this.store.select(selectRoute)),
      map(([navigationStart, isActive, route]) => {
        if (!isActive || !route) return { type: CustomActionTypes.NO_ACTION };

        const navigationUrl = (navigationStart as NavigationStart).url;
        if (navigationUrl !== route) {
          this.router.navigate([route]);
        }
        return { type: CustomActionTypes.NO_ACTION };
      }),
    ),
  );

  /**
   * Handles modal initialization after a slight delay.
   * Opens generate modal if the current step is a modal step.
   */
  initModal$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      delay(1000),
      take(1),
      withLatestFrom(this.store.select(selectIsTourActive), this.store.select(selectCurrentStepIndex)),
      map(([_action, _isActive, currentStepIndex]) => {
        const steps = this.tourService.getSteps();
        const currentStep = steps[currentStepIndex];

        if (currentStep.isModal) {
          const element = document.querySelector('#tree-item-dataset');
          if (!element) return { type: CustomActionTypes.NO_ACTION };
          (element as HTMLElement).click();
          setTimeout(() => {
            const generateElement = document.querySelector('#action-bar-0');

            (generateElement as HTMLElement).click();
          }, 500);
        }
        return { type: CustomActionTypes.NO_ACTION };
      }),
    ),
  );

  /**
   * Completes the next or previous step navigation by dispatching
   * appropriate completion actions with current step index.
   */
  nextStepComplete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TourActions.nextStep, TourActions.prevStep),
      withLatestFrom(this.store.select(selectCurrentStepIndex)),
      switchMap(([action, currentStepIndex]) => {
        if (action.type === TourActions.nextStep.type) {
          return of(TourActions.nextStepComplete({ currentStepIndex }));
        } else if (action.type === TourActions.prevStep.type) {
          return of(TourActions.prevStepComplete({ currentStepIndex }));
        }

        return EMPTY;
      }),
    ),
  );

  /**
   * Listens for step navigation actions and triggers associated
   * custom actions defined for next/previous steps.
   * For tree view steps, passes the tree component instance.
   */
  triggerActionsStepsListener$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TourActions.nextStep, TourActions.prevStep),
      withLatestFrom(this.store.select(selectCurrentStepIndex)),
      map(([action, currentStepIndex]) => {
        const steps = this.tourService.getSteps();
        if (action.type === TourActions.nextStep.type) {
          const nextStep = steps[currentStepIndex + 1];
          if (nextStep.onNextTriggerAction) {
            nextStep.onNextTriggerAction();
          }
        } else if (action.type === TourActions.prevStep.type) {
          const prevStep = steps[currentStepIndex - 1];
          if (prevStep.onPrevTriggerAction) {
            prevStep.onPrevTriggerAction(this.router);
          }
        }

        return TourActions.setStepReady({ isStepReady: false });
      }),
    ),
  );

  /**
   * Updates step ready state after step navigation by checking
   * if the target element is loaded and visible.
   */
  updateStepReadyAfterClick$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TourActions.nextStepComplete, TourActions.prevStepComplete),
      withLatestFrom(this.store.select(selectCurrentStepIndex)),
      switchMap(([_action, currentStepIndex]) => {
        const steps = this.tourService.getSteps();
        const currentStep = steps[currentStepIndex];
        return currentStep.isViewLoaded(currentStep.element).pipe(
          map((isStepReady) => {
            return TourActions.setStepReady({ isStepReady });
          }),
        );
      }),
    ),
  );

  /**
   * Updates the position of tour overlay when step is ready.
   * Calculates position based on target element's position and step configuration.
   * Includes delay to ensure element is fully rendered and positioned.
   */
  updatePositionWhenIsStepReady$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TourActions.setStepReady),
      withLatestFrom(this.store.select(selectCurrentStepIndex)),
      mergeMap(([action, currentStepIndex]) => {
        const steps = this.tourService.getSteps();
        const currentStep = steps[currentStepIndex];
        if (action.type === TourActions.setStepReady.type && !action.isStepReady) return EMPTY;

        // Add delay to ensure element is fully positioned after scrolling
        return timer(200).pipe(
          map(() => {
            const element = document.querySelector(currentStep.element);

            if (!element) throw new Error(`Element not found for step: ${JSON.stringify(currentStep)}`);

            const rect = element.getBoundingClientRect();
            const position = getPositionStyle(currentStep, rect);

            return TourActions.setCurrentPositionComplete({ currentPosition: position });
          }),
        );
      }),
    ),
  );

  setCurrentPosition$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TourActions.setCurrentPosition),
      mergeMap(({ stepIndex }) => {
        const steps = this.tourService.getSteps();
        const currentStep = steps[stepIndex];
        const maxAttempts = 10;
        return timer(0, 1000).pipe(
          map((attemptIndex) => attemptIndex + 1),
          takeWhile((attemptCount) => {
            const element = document.querySelector(currentStep.element);
            if (element || attemptCount >= maxAttempts) return false;
            return true;
          }, true),
          map(() => {
            const element = document.querySelector(currentStep.element);

            if (element) {
              const rect = element.getBoundingClientRect();
              const currentPosition = getPositionStyle(currentStep, rect);
              return TourActions.setCurrentPositionComplete({ currentPosition });
            } else {
              return { type: CustomActionTypes.NO_ACTION };
            }
          }),
          catchError(() => {
            return of({ type: CustomActionTypes.NO_ACTION });
          }),
        );
      }),
    ),
  );

  /**
   * Its used to setup current route when user is on another route then move to this route
   */
  setCurrentRoute$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TourActions.setStepReady),
      mergeMap(() => {
        const url = this.router.url;
        const route = url.substring(url.indexOf('/'));

        return of(TourActions.setCurrentRoute({ route }));
      }),
    ),
  );

  /**
   * Handles actions when reaching the last step of the tour.
   * Executes custom exit click handler if defined.
   */
  triggerActionOnLastElement$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TourActions.lastStep),
      withLatestFrom(this.store.select(selectCurrentStepIndex)),
      map(([_action, currentStepIndex]) => {
        const steps = this.tourService.getSteps();
        const currentStep = steps[currentStepIndex];
        if (currentStep.onExitClick) {
          currentStep.onExitClick();
        }
        return { type: CustomActionTypes.NO_ACTION };
      }),
    ),
  );

  completeTour$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TourActions.completeTour),
      switchMap(() => this.tourApiService.setCompletedTour().pipe(map(() => TourActions.stopTour()))),
    ),
  );

  exitTour$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(TourActions.exitTour),
        withLatestFrom(this.store.select(selectCurrentStepIndex)),
        tap(([_, currentStepIndex]) => {
          const steps = this.tourService.getSteps();
          const isLastStep = currentStepIndex === steps.length - 1;

          if (isLastStep) {
            this.store.dispatch(TourActions.lastStep());
          }

          this.store.dispatch(TourActions.stopTour());
          this.highlighOverlayService.closeOverlay();
          this.tourService.stopTour();
        }),
        switchMap(() => this.tourApiService.setCompletedTour().pipe(catchError(() => of(null)))),
      ),
    { dispatch: false },
  );
}
