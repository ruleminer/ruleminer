import { KaplanMeierEstimator } from '../../../../../columns/cells/survival-rule-estimator-curve/survival-rule-estimator-curve.component';

export interface SurvivalConditionCoverage {
  kaplan_meier_estimator: KaplanMeierEstimator;
  median_survival_time: number | string;
  median_survival_time_ci_lower: number | string;
  median_survival_time_ci_upper: number | string;
  events_count_sum: number;
  censored_count_sum: number;
}
