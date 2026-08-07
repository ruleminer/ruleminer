import { Ids } from '../../../../../../common/store/ruleSets/rulesets.selectors';
import { PredictionConfig } from '../../../../../../common/store/v2DetailsOfRuleSetGeneration/types';
import { ProblemTypes } from '../../../../../data-upload/utils/enums';
import { Algorithm } from '../../../../models/project';
import { Rule } from '../../../../models/ruleset';
import { DatasetInfo, RuleSetGenerationMethods } from '../algorithm-configuration/types';
import { ParamsChangeObject } from '../simple-rules-generator/simple-rules-generator.component';

export type RulesetGenerateForAlgorithmData = {
  ids: Ids;
  rulesetName: string;
  algorithm: Algorithm;
  decisionAttributeName: string;
  generationMethod: RuleSetGenerationMethods;
  algorithmParams: Record<string, string | number | boolean>;
  questionsAnswers: ParamsChangeObject;
  expertInduction: {
    enabled: boolean;
    params: Record<string, any> | undefined;
  };
  crossValidation: {
    enabled: boolean;
    numFolds: number;
  };
  predictionConfig: PredictionConfig;
  attributesToSkip: string[];
};

export type RulesetManualGenerateData = {
  ids: Ids;
  decisionAttributeName: string;
  rulesetName: string;
  manuallySelectedIds: { dataSetId: number; ruleSetId: number };
  selectedManuallyRules: Rule[];
  predictionConfig: PredictionConfig;
  problemType: ProblemTypes;
  datasetInfo: DatasetInfo;
};
