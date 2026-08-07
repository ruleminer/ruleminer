import { RuleSimilarity } from '../../../models/ruleset';
import { PreparedRule } from '../../types';

export type ComparisonCalulateSimilarityButtonOutput = {
  ruleSimilarity: RuleSimilarity;
  rulesetOneData: PreparedRule[];
  rulesetTwoData: PreparedRule[];
  relationType: boolean;
};
