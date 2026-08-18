import { Label } from '../../../common/components/label/interfaces/label.model';
import { GeneralIndicators, PredictionIndicators } from '../../../common/store/app-state.model';
import { ProblemTypes } from '../../data-upload/utils/enums';
import { Process } from '../process/models/process.model';

export interface Project {
  id: number;
  name: string;
  description: string;
  type_of_problem: ProblemTypes;
  created_at: string;
  updated_at: string;
  last_opened_at: string;
}

export interface AllProjectsSummary {
  id: number;
  name: string;
  type_of_problem: ProblemTypes;
  last_opened_at: string;
  updated_at: string;
  dataset_count: number;
  ruleset_count: number;
  report_count: number;
  total_size: number;
}

export interface ProjectSummary {
  id: number;
  name: string;
  is_active: boolean;
  number_of_columns: number;
  number_of_rows: number;
  report_count: number;
  ruleset_count: number;
  size: number;
}

export type ProjectEdit = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'last_opened_at'>;

export interface RulesTableRow {
  uuid: string;
  string: string;
  premise: any;
  conclusion: {
    value: string;
  };
  ruleSetId: number;
  p: number;
  n: number;
  P: number;
  N: number;
  labels: Label[];
  p_unique: number;
  'n-unique': number;
  num_of_condtitions: number;
  precision: number;
  coverage: number;
  C2: number;
  RSS: number;
  Correlation: number;
  Lift: number;
  'p-Val_adjusted': number;
  autoIncrement: number;
  compare: boolean | undefined;
}

export interface IndicatorRecord {
  rule_uuid: string;
  indicators: {
    [key: string]: any;
  };
}

export interface IndicatorResponse {
  indicators_data: IndicatorRecord[];
}

export interface QuantitativeCharacteristics {
  avg_conditions_count: number;
  avg_coverage: number;
  avg_precision: number;
  rules_count: number;
}

export interface PredictionIndicatorsResponse {
  type_of_problem: string;
  general: GeneralIndicators;
  for_classes: PredictionIndicators;
  histogram: { bin_edges: number[]; histogram: number[]; min: number; max: number };
}

export type AttributeImportance = {
  attribute_name: string;
  importance: number;
};

export type ConditionImportance = {
  condition: string;
  importance: number;
};

export type CrossValidation = {
  num_folds: number;
  result: Record<string, Record<string, number>>;
  ruleset: number;
};

export type Algorithm = {
  id: number;
  problem_type: string;
  name: string;
  version: string | null;
  description_pl: string;
  description_en: string;
  translateKey?: string;
  na_generation: boolean; // whether simple generation is possible for this algorithm
  expert_induction: boolean; // whether expert induction is possible for this algorithm
};

export interface AlgorithmParams {
  name: string;
  version: string;
  parameters: Parameter[];
  expert_parameters: any[];
}

export interface Parameter {
  id: number;
  name: string;
  parameter_type: 'choice' | 'int' | 'float' | 'bool' | 'expert_rules' | 'expert_conditions' | 'expert_attributes';
  parameter_values?: string[];
  expert_induction: boolean;
  description_pl: string;
  description_en: string;
  default_value: any;
  min_value: number;
  max_value: number;
  algorithm: number;
}
export interface Attribute {
  id: number;
  name: string;
}

export type PredictionIndicatorsTable = Omit<PredictionIndicators['general'], 'Confusion_matrix'>;

export interface Answer {
  answer_number: number;
  answer_text_pl: string;
  answer_text_en: string;
  next_question_number: number;
  selected?: boolean;
}

export interface Question {
  question_number: number;
  algorithm_name: string;
  question_text_pl: any;
  question_text_en: any;
  question_answers: Answer[];
}
export interface NotAdvancedAlgorithmParams {
  id: number;
  algorithm_name: string;
  answer_string: string;
  params_json: any;
}

export interface GenerateUnadvancedRuleset {
  name: string;
  generation_method: string;
  description: string;
  algorithm_params: {
    induction_measure?: string;
    pruning_measure?: string;
    voting_measure?: string;
    min_rule_coverage?: number;
  };
  attributes_to_skip?: string[];
  cross_validation: string;
  num_folds: number;
  algorithm_id: number;
}

type ParameterValue = {
  value: string;
  description_pl: string;
  description_en: string;
  algorithm_params: string;
};

type AllAlgorithmParams = {
  id: number;
  parameter_values: ParameterValue[];
  name: string;
  parameter_type: string;
  expert_induction: boolean;
  description_pl: string;
  description_en: string;
  default_value: string;
  min_value: string;
  max_value: string;
  algorithm: string;
};

export type ParametersNormalAndAdvanced = {
  name: string;
  version: string;
  parameters: AllAlgorithmParams[];
  expert_parameters: AllAlgorithmParams[];
};

export interface ProcessApiResponse {
  count: number;
  next: null | string;
  previous: null | string;
  results: Process[];
}

export interface AllProjectsSummaryApiResponse {
  count: number;
  next: null | string;
  previous: null | string;
  results: AllProjectsSummary[];
}

export interface ProjectSummaryApiResponse {
  count: number;
  next: null | string;
  previous: null | string;
  results: ProjectSummary[];
}

export interface MatchingDatasetsRequestBody {
  dataset_id: number;
  must_contain_all_given_attributes?: boolean;
}

export interface MatchingDataset {
  id: number;
  name: string;
}

export interface HistogramElement {
  attribute_name: string;
  counts: number[];
  division: number[];
  checked: boolean;
}

export interface BarPlotElement {
  attribute_name: string;
  values: string[];
  counts: number[];
  checked: boolean;
}

export interface CorrelationMatrix {
  x: string[];
  y: string[];
  z: number[][];
}

export interface RulesetEntry {
  id: number;
  name: string;
  checked: boolean;
}

export interface UploadResponse {
  dataset_id: number;
  project_id: number;
  name: string;
  description: string;
}
