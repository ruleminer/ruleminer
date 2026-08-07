import { RuleSimilarity } from '../../models/ruleset';
import { PreparedRule } from '../types';

export type ComparisonChartData = {
  relationType: boolean;
  ruleSimilarity: RuleSimilarity;
  rulesetOne: PreparedRule[];
  rulesetTwo: PreparedRule[];
  secondRulesetName: string;
  firstRulesetName: string;
};
