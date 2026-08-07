import { Label } from '../../../common/components/label/interfaces/label.model';
import { PredictionConfig } from '../../../common/store/v2DetailsOfRuleSetGeneration/types';
import { V2RulesTableMeta } from '../../../common/store/v2RulesTable/types';
import { Roles } from '../../data-upload/utils/enums';
import { KaplanMeierEstimator } from '../project-rules/project-rules-table/columns/cells/survival-rule-estimator-curve/survival-rule-estimator-curve.component';
import { RegressionConclusionValue } from '../project-rules/project-rules-table/project-rules-table-editor/rules-editor-side-column/rule-conclusion-editor/regression/models/conclusion';

interface BaseRuleSetMeta {
  attributes: string[];
  decision_attribute: string;
}

export interface ClassificationMeta extends BaseRuleSetMeta {
  decision_attribute_distribution: {
    [key: string]: number;
  };
  survival_time_attribute?: string;
}
export interface RegressionMeta extends BaseRuleSetMeta {
  y_train_median: number;
}
export interface SurvivalMeta extends BaseRuleSetMeta {
  survival_time_attribute: string;
  default_conclusion: KaplanMeierEstimator;
}

export interface Premise {
  type: string;
  operator: string;
  subconditions: Subcondition[];
}

export interface Subcondition {
  type: string;
  attributes: number[];
  negated: boolean;
  text: string;
  checked: boolean | undefined;
}

export interface Conclusion {
  fixed?: boolean;
  value: string;
}

export interface Rule {
  uuid: string;
  string: string;
  premise: Premise;
  conclusion: Conclusion | RegressionConclusionValue;
  labels?: Label[];
  checked?: boolean;
  coverage?: SimpleRuleCoverage;
  index?: number | undefined;
  displayString?: string;
  voting_weight?: number | null;
}

export interface EditedRow {
  string: string;
  uuid: string;
  premise: Premise;
  conclusion: Conclusion;
  displayConclusion: Conclusion;
  displayString: string;
  active: boolean;
  autoIncrement: number;
  labels: { id: number; name: string; color: string }[];
}

export interface SimpleRuleCoverage {
  p: number;
  n: number;
  P: number;
  N: number;
}

export interface RuleSimilarityRequest {
  similarity_type: string;
  measure?: string;
  ruleset_1: JSONRuleSetResponse;
  ruleset_2: JSONRuleSetResponse;
}

export interface RuleSimilarity {
  [key: string]: {
    [key: string]: number;
  };
}

export interface RuleSimilarityResponse {
  rule_similarity: RuleSimilarity;
}

export interface JSONRuleSetResponse {
  meta: V2RulesTableMeta;
  rules: Rule[];
}

export interface RuleCoverageResponse {
  rule_coverage: RuleCoverage;
}

export interface RuleCoverage {
  [key: string]: {
    p: number;
    n: number;
    P: number;
    N: number;
    train_covered_y_std?: number;
    train_covered_y_mean?: number;
    kaplan_meier_estimator?: KaplanMeierEstimator;
  };
}

export interface RuleCoverageRow {
  uuid: string;
  p: number;
  n: number;
  P: number;
  N: number;
}

export interface ConditionCoverageRequest {
  complementary?: boolean;
  meta: { attributes: string[] };
  conditions: Premise[][];
}

export interface RuleSetDetailsRequest {
  name: string;
  description?: string;
}

export interface NewRow {
  uuid: string;
  string: string;
  labels: { id: number; name: string; color: string }[];
  premise: {
    operator: string;
    type: string;
    subconditions: {
      type: string;
      attributes: number[];
      negated: boolean;
      left: null;
      right: number;
      left_closed: boolean;
      right_closed: boolean;
    }[];
  };
  conclusion: {
    value: string;
  };
  rule_uuid: string;
  autoIncrement: number;
  displayString: string;
}

export class GenerateReportResponse {
  task_id: number;
}

export interface Dataset {
  id: number;
  name: string;
  description: string;
  created_at: string;
  path: string;
}
export interface SurvivalPredictionItem {
  times: number[];
  probabilities: number[];
  median_survival_time: string | number;
}

export interface CopyRulesetRequest {
  name: string;
  description: string;
}

export interface CreateRulesetRequest {
  name: string;
  description: string;
  ruleset: {
    meta: any;
    rules: any[];
  };
  rules_labels: Record<string, number[]>;
  attached_to_dataset_id: number;
  prediction_config: PredictionConfig;
}

export interface ProcessCreatedResponse {
  task_id: number;
}

export interface RulesetImport {
  name: string;
  description: string;
  voting_measure?: string;
  prediction_config: PredictionConfig;
  external_algorithm_name: string;
}

export interface RuleSetDetailsResponse {
  id: number;
  create_timestamp: string;
  name: string;
  description: string;
  generation_params: {
    attributes: {
      name: string;
      role: Roles;
    }[];
    algorithm_params: {
      max_growing: number;
      minsupp_new: number;
      ignore_missing: boolean;
      max_rule_count: number;
      voting_measure: string;
      pruning_measure: string;
      induction_measure: string;
      approximate_induction: boolean;
      select_best_candidate: boolean;
      approximate_bins_count: number;
      max_uncovered_fraction: number;
      complementary_conditions: boolean;
      control_apriori_precision: boolean;
    };
    expert_induction: ExpertRulesConfig;
  };
  rules_count: number;
  avg_conditions_count: number;
  avg_precision: number;
  avg_coverage: number;
  generated_from_dataset: number;
  algorithm: number;
  generation_time: number;
  indicator_calculation_time: number;
  type: string;
  prediction_config: PredictionConfig;
}

export interface ExpertRulesConfig {
  expert_rules: [string, string][];
  consider_other_classes: boolean;
  extend_using_automatic: boolean;
  extend_using_preferred: boolean;
  induce_using_automatic: boolean;
  induce_using_preferred: boolean;
  expert_forbidden_conditions: any[];
  expert_preferred_conditions: [string, string][];
  preferred_attributes_per_rule: number;
  preferred_conditions_per_rule: number;
}
