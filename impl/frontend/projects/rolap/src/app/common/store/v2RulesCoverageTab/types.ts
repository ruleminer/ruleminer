import { ProblemTypes } from '../../../main/data-upload/utils/enums';
import { Ids } from '../ruleSets/rulesets.selectors';
import { V2RulesTableMeta } from '../v2RulesTable/types';

export type VisibleRule = { uuid: string; ruleName: string };
export type FilteringRule = VisibleRule;

export enum FilterOperators {
  OR = 'or',
  AND = 'and',
}

export interface CurrentTabData {
  ids: Ids;
  currentTabId: string;
}

export type UniqueCoverage = {
  unique_examples: {
    uuid: string;
    ids: string[];
    p_unique: number;
    n_unique: number;
  }[];
};

export interface v2RulesCoverageTab {
  id: string; // NgRx entity store id
  visibleRules: VisibleRule[];
  filteringRules: FilteringRule[];
  filterOperator: FilterOperators;
  isUniqueCoverage: boolean;
  uniqueExamples: UniqueCoverage;
}

export interface v2RulesCoverageTabRuleSet {
  meta: V2RulesTableMeta;
  rules: any[];
}

export interface RulesCoverageTableStoreData {
  ids: Ids;
  projectProblemType: ProblemTypes;
  ruleset: v2RulesCoverageTabRuleSet;
  newVisibleRules?: VisibleRule[];
  newRulesFilter?: FilteringRule[];
}
