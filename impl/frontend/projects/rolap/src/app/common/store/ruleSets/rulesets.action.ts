import { createAction } from '@ngrx/store';

import { PredictionIndicatorsResponse } from '../../../main/project/models/project';
import { HistogramTab, Tabs, refreshAll } from '../app-state.model';
import { Ids } from './rulesets.selectors';

export const setIsLoadingRuleAttributesAndConditionImportance = createAction(
  '[Tabs] Set Is loading Attributes and Condition Importance',
  (data: { ids: Ids; isLoading: boolean }) => {
    return {
      data,
    };
  },
);

export const setIsLoadingQuantitativeCharacteristics = createAction(
  '[Tabs] Set Is loading Quantitative Characteristics',
  (data: { ids: Ids; isLoading: boolean }) => {
    return {
      data,
    };
  },
);

export const setIsLoadingPredictionIndicators = createAction(
  '[Tabs] Set Is loading Prediction Indicators',
  (data: { ids: Ids; isLoading: boolean }) => {
    return {
      data,
    };
  },
);

export const rulesetEdited = createAction('[Tabs] Ruleset edited', (data: Tabs) => ({
  data,
}));

export const ruleSetPredictionIndicatorsStateChange = createAction(
  '[Tabs] RuleSet Prediction Indicators table state change',
  (data: { v2TabId: string; state: any }) => ({
    data,
  }),
);

export const ruleSetQuantitativeCharacteristicsStateChange = createAction(
  '[Tabs] RuleSet Quantitative Characteristics table state change',
  (data: { v2TabId: string; state: any }) => ({
    data,
  }),
);

export const ruleSetConditionImportanceStateChange = createAction(
  '[Tabs] RuleSet Condition Importance table state change',
  (data: { v2TabId: string; state: any }) => ({
    data,
  }),
);

export const ruleSetAttributesImportanceStateChange = createAction(
  '[Tabs] RuleSet Attributes Importance table state change',
  (data: { v2TabId: string; state: any }) => ({
    data,
  }),
);

export const ruleSetPredictionIndicatorsRefreshChange = createAction(
  '[Tabs] RuleSet Prediction Indicators refresh change',
  (data: { ids: Ids; needsRefresh: boolean }) => ({
    data,
  }),
);

export const ruleSetQuantitativeCharacteristicsRefreshChange = createAction(
  '[Tabs] RuleSet Quantitative Characteristics refresh change',
  (data: { ids: Ids; needsRefresh: boolean }) => ({
    data,
  }),
);

export const ruleSetImportanceRefreshChange = createAction(
  '[Tabs] RuleSet Importance refresh change',
  (data: { ids: Ids; needsRefresh: boolean }) => ({
    data,
  }),
);

export const loadRulePredictionIndicators = createAction(
  '[Tabs] Load Rule Prediction Indicators',
  (data: { ids: Ids; data: any }) => ({
    data,
  }),
);

export const loadRuleQuantitativeCharacteristics = createAction(
  '[Tabs] Load Quantitative Characteristics',
  (data: { ids: Ids; data: any }) => ({
    data,
  }),
);

export const loadRuleConditionImportance = createAction('[Tabs] Load Condition Importance', (data: any) => ({
  data,
}));

export const loadPredictionGeneralIndicators = createAction(
  '[Tabs] Load Prediction Attributes Importance',
  (data: any) => ({
    data,
  }),
);

export const loadRuleAttributesAndConditionImportance = createAction(
  '[Tabs] Load Attributes and Condition Importance',
  (data: { ids: Ids; data: { attribute_importance: any; condition_importance: any } }) => ({
    data,
  }),
);

export const loadPredictionIndicators = createAction('[Tabs] Load Prediction Indicators', (data: any) => ({
  data,
}));

export const predictionIndicatorsRefreshAllChange = createAction(
  '[Tabs] Load Prediction Indicators refresh all change',
  (data: { ids: Ids; refreshAll: refreshAll }) => ({
    data,
  }),
);

export const rulesRefreshAllChange = createAction(
  '[Tabs] Rules Tab refresh all change',
  (data: { ids: Ids; refreshAll: refreshAll }) => ({
    data,
  }),
);

export const predictionIndicatorsTrainingDataRefresh = createAction(
  '[Tabs] Load Prediction Indicators training data refresh',
  (data: { ids: Ids; needsRefresh: boolean }) => ({
    data,
  }),
);

export const predictionIndicatorsTestDataRefresh = createAction(
  '[Tabs] Set Prediction Indicators test data refresh',
  (data: { ids: Ids; needsRefresh: boolean }) => ({
    data,
  }),
);

export const loadPredictionIndicatorsTestData = createAction(
  '[Tabs] Load Prediction Indicators test data',
  (data: { ids: Ids; data: any }) => ({
    data,
  }),
);

export const setSelecteDataSetForPredictionIndicatorsTestCard = createAction(
  '[Tabs] Set Prediction Indicators test selected item',
  (data: { ids: Ids; selectedDataSet: any }) => ({
    data,
  }),
);

export const loadPredictionCrossValidation = createAction(
  '[Tabs] Load Prediction Cross Validation',
  (data: { data: any; v2TabId: string }) => ({
    data,
  }),
);

export const loadDatasetStatistics = createAction('[Dataset] Load Dataset Statistics', (data: any) => {
  return { data, dataSetId: data.dataSetId };
});
export const loadRuleCoverageRuleTable = createAction(
  '[Tabs] Load Rule Coverage Rule Table',
  (data: { data: any; v2TabId: string }) => ({
    data,
  }),
);

export const setHistogramVisualisationTab = createAction(
  '[Tabs] Set Histogram Visualisation Tab',
  (data: { ruleSetId: number; dataSetId: number; projectId: number; histogramTab: HistogramTab }) => ({
    data,
  }),
);

export const prefetchRulePredictionIndicators = createAction(
  '[Tabs] Prefetch Rule Prediction Indicators',
  (data: { ids: Ids; indicators: PredictionIndicatorsResponse }) => ({
    data,
  }),
);
