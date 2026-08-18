import { createFeatureSelector, createSelector } from '@ngrx/store';

import { TourState } from './tour.reducer';

export const selectTourState = createFeatureSelector<TourState>('tour');

export const selectCurrentStepIndex = createSelector(selectTourState, (state) => state.currentStepIndex);

export const selectIsTourActive = createSelector(selectTourState, (state) => state.active);
export const selectCurrentTourPosition = createSelector(selectTourState, (state) => state.currentPosition);
export const selectIsStepReady = createSelector(selectTourState, (state) => state.isStepReady);
export const selectRoute = createSelector(selectTourState, (state) => state.route);
export const selectIsFirstStep = createSelector(selectCurrentStepIndex, (currentStepIndex) => currentStepIndex === 0);

export const selectVisibleSteps = (maxVisible: number, steps: any[]) =>
  createSelector(selectCurrentStepIndex, (currentStepIndex) => {
    const totalSteps = steps.length;

    if (totalSteps <= maxVisible) {
      return steps;
    }

    let start = Math.max(0, currentStepIndex - Math.floor(maxVisible / 2));
    let end = start + maxVisible;
    if (end > totalSteps) {
      end = totalSteps;
      start = Math.max(0, end - maxVisible);
    }
    return steps.slice(start, end);
  });

export const selectLocalCurrentStepIndex = (maxVisible: number, steps: any[]) =>
  createSelector(selectCurrentStepIndex, (currentStepIndex) => {
    const totalSteps = steps.length;

    if (totalSteps <= maxVisible) {
      return currentStepIndex;
    }

    let start = Math.max(0, currentStepIndex - Math.floor(maxVisible / 2));
    let end = start + maxVisible;
    if (end > totalSteps) {
      end = totalSteps;
      start = Math.max(0, end - maxVisible);
    }
    return currentStepIndex - start;
  });
