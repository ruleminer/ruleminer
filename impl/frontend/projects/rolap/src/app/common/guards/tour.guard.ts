import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { combineLatest, map, take } from 'rxjs';

import { Store } from '@ngrx/store';

import { TourService } from '../components/tour/tour.service';
import { AppState } from '../store/app-state.model';
import { selectCurrentStepIndex, selectIsTourActive } from '../store/tour/tour.selectors';

export const TourGuard: CanActivateFn = (route, state) => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  const tourService = inject(TourService);

  return combineLatest([store.select(selectIsTourActive), store.select(selectCurrentStepIndex)]).pipe(
    take(1),
    map(([isTourActive, currentStepIndex]) => {
      if (!isTourActive) return true;

      const steps = tourService.getSteps();
      const currentStep = steps[currentStepIndex];
      const allowedRoutes = currentStep?.route
        ? Array.isArray(currentStep.route)
          ? currentStep.route
          : [currentStep.route]
        : null;

      if (!allowedRoutes) return true;

      return allowedRoutes.includes(state.url) ? true : router.parseUrl(allowedRoutes[0]);
    }),
  );
};
