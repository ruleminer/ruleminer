import { PredictionConfig } from '../../../../../../common/store/v2DetailsOfRuleSetGeneration/types';
import { DatasetAttribute } from '../../../../dataset/models/dataset';
import { ParamsChangeObject } from '../simple-rules-generator/simple-rules-generator.component';

export enum RuleSetGenerationMethods {
  Simple = 'simple_configuration',
  Advanced = 'advanced_configuration',
}

export type DatasetInfo = {
  decisionAttributeName: string;
  datasetAttributes: DatasetAttribute[];
  attributes: string[];
  datasetName: string;
  classDistribution: { [className: string]: number } | null;
  initialAttributesToSkip: string[];
};

export type AlgorithmConfigChangeEvent = {
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
  formValid: boolean;
};
