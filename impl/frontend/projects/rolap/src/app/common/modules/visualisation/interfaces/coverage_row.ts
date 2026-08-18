import { Rule } from '../../../../main/project/models/ruleset';
import { V2RulesTableMeta } from '../../../store/v2RulesTable/types';

export interface CoverageRow {
  class_name: string;
  coverage_count: string;
  all_count: string;
  precision: string;
  coverage: string;
}

export interface PredictionResult {
  coverage: CoverageRow;
  datasetId: number;
  originalId: number;
  rulesets: { meta: V2RulesTableMeta; rules: Rule[] };
}

export const COVERAGE_RULE_EDITOR = {
  class_name: '',
  coverage_count: 'p',
  all_count: 'P',
};
