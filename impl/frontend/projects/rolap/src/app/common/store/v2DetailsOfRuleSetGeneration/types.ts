import { Roles } from '../../../main/data-upload/utils/enums';
import { RuleSetDetailsResponse } from '../../../main/project/models/ruleset';

export interface Attribute {
  name: string;
  role: Roles;
}

export interface PredictionConfig {
  prediction_strategy: string;
  voting_measure: string;
  use_default_rule: boolean;
}

export interface V2DetailsOfRuleSetGeneration {
  id: string;
  table: RuleSetDetailsResponse;
  algoName: string | null;
}
