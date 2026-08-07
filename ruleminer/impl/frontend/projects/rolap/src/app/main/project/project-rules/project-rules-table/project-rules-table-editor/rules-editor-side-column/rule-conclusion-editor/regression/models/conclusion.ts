import { BaseConclusion } from '../../rule-conclusion-editor.component';

export interface RegressionConclusionValue extends BaseConclusion {
  train_covered_y_min: number | null;
  train_covered_y_max: number | null;
  train_covered_y_std: number | null;
  train_covered_y_mean: number | null;
  high: number | null;
  low: number | null;
  fixed: boolean;
}

export enum ConclusionTypes {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
}
