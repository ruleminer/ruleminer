import { createReducer, on } from '@ngrx/store';

import { TourActions } from './tour.action';
import { CurrentPosition } from './types';

export interface TourState {
  currentStepIndex: number;
  active: boolean;
  currentPosition: CurrentPosition | null;
  isStepReady: boolean;
  route: string | null;
}

const initialState: TourState = {
  currentStepIndex: 0,
  active: false,
  currentPosition: null,
  isStepReady: false,
  route: null,
};

export const tourReducer = createReducer(
  initialState,
  on(TourActions.nextStep, (state) => ({
    ...state,
  })),
  on(TourActions.prevStep, (state) => ({
    ...state,
  })),
  on(TourActions.stopTour, (state) => ({
    ...state,
    active: false,
    currentStepIndex: 0,
    route: null,
  })),
  on(TourActions.startTour, (state) => ({
    ...state,
    active: true,
  })),
  on(TourActions.setCurrentPosition, (state, {}) => ({
    ...state,
  })),
  on(TourActions.setCurrentPositionComplete, (state, { currentPosition }) => ({
    ...state,
    currentPosition,
  })),
  on(TourActions.setStepReady, (state, { isStepReady }) => ({
    ...state,
    isStepReady,
  })),
  on(TourActions.nextStepComplete, (state, { currentStepIndex }) => ({
    ...state,
    currentStepIndex: currentStepIndex + 1,
  })),
  on(TourActions.prevStepComplete, (state, { currentStepIndex }) => ({
    ...state,
    currentStepIndex: currentStepIndex - 1,
  })),
  on(TourActions.setCurrentRoute, (state, { route }) => ({
    ...state,
    route,
  })),
  on(TourActions.lastStep, (state) => ({
    ...state,
  })),
  on(TourActions.completeTour, (state) => ({
    ...state,
  })),
  on(TourActions.stopTour, () => initialState),
);
