import { PredictionConfig } from 'projects/rolap/src/app/common/store/v2DetailsOfRuleSetGeneration/types';

export interface CreateAndUploadProjectResponse {
  project: {
    id: number;
    name: string;
    description: string;
    type_of_problem: string;
    created_at: string;
    updated_at: string;
    last_opened_at: string;
  };
  dataset: {
    dataset_id: number;
    project_id: number;
    name: string;
    description: string;
  };
}

export interface RulesetOverwriteRequest {
  ruleset: { meta: any; rules: any[] };
  rules_labels: Record<string, number[]>;
  prediction_config: PredictionConfig;
}

export interface RuleSetGenerationRequest {
  name: string;
  description: string;
  generation_method: string;
  algorithm_params: Record<string, string | number | boolean | null>;
  expert_induction?: Record<string, any>;
  attributes_to_skip: string[];
  prediction_config: PredictionConfig;
  cross_validation: boolean;
  algorithm_id: number;
  num_folds?: number;
}
