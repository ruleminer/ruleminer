import { VisibleRule } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/types';

export interface CoverageMatrix {
  coverage_matrix: { [ruleUuid: string]: boolean[] };
  prediction: any;
}

export interface TableSummary {
  rowsCount: number;
  columnsCount: number;
}

export interface VisibleRuleColumn extends VisibleRule {
  columnName: string;
}
