import { SimpleRuleCoverage } from 'projects/rolap/src/app/main/project/models/ruleset';

export interface RegressionRuleCoverage extends SimpleRuleCoverage {
  train_covered_y_min: number;
  train_covered_y_max: number;
  train_covered_y_std: number;
  train_covered_y_mean: number;
}

export interface RegressionConditionCoverage extends SimpleRuleCoverage {
  covered_y_mean: number;
  covered_y_std: number;
  covered_y_min: number;
  covered_y_max: number;
}
