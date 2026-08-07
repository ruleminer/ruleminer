export type V2Tour = {
  active: boolean;
  currentStepIndex: number;
  currentPosition: CurrentPosition;
  isStepReady: boolean;
  route: string;
};

export type CurrentPosition = { top: string; left: string; isAbove?: boolean };
