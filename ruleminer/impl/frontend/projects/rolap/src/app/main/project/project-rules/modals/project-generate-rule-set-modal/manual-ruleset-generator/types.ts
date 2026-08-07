import { PredictionConfig } from '../../../../../../common/store/v2DetailsOfRuleSetGeneration/types';
import { Rule } from '../../../../models/ruleset';

export type ManualGenerationConfigChangeEvent = {
  valid: boolean;
  selectedManuallyRules: Rule[];
  manuallySelectedIds: { dataSetId: number; ruleSetId: number };
  predictionConfig: PredictionConfig;
};
