import { createFeatureSelector, createSelector } from '@ngrx/store';

import { ProblemTypes } from '../../../main/data-upload/utils/enums';
import { DatasetAttribute, DatasetAttributesRoles } from '../../../main/project/dataset/models/dataset';
import { AppState, Tabs } from '../app-state.model';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';

export type Ids = {
  projectId: number | undefined;
  dataSetId?: number | undefined;
  ruleSetId?: number | undefined;
  reportId?: number | undefined;
};

export const getTabs = createFeatureSelector<AppState['tabs']>('tabs');
export const getTypeOfProblem = (state: AppState) => state.project.activeProject.type_of_problem;

export const getCurentTabBasedOnv2CurrentTab = createSelector(selectCurrentV2TabId, getTabs, (currentV2TabId, tabs) =>
  tabs.find((tab) => tab.id === currentV2TabId),
);

export const getCrossValidationNumOfFolds = createSelector(getCurentTabBasedOnv2CurrentTab, (currentTab) => {
  return currentTab?.data.predictionTab.crossValidation.numOfFolds;
});

export const getCurrentStatistic = createSelector(getCurentTabBasedOnv2CurrentTab, (tab) => {
  const currentTab = tab as Tabs;

  if (!currentTab || !currentTab.data || !currentTab.data.datasetTab) return;

  const statisticsTab = currentTab?.data.datasetTab.statisticsTab;
  return statisticsTab;
});

export const getCurrentTestCard = createSelector(getCurentTabBasedOnv2CurrentTab, (tab) => {
  const currentTab = tab as Tabs;
  const testCard = currentTab?.data.predictionTab.testCard;
  return testCard;
});

export const isSelectedDataSetAvivable = createSelector(getCurrentTestCard, (testCard) => {
  const selectedDataSet = testCard?.selectedDataSet;
  if (!selectedDataSet) return false;
  return true;
});

export const getDecisionAttribute = createSelector(
  getTypeOfProblem,
  getCurentTabBasedOnv2CurrentTab,
  (problemType, tab) => {
    const currentTab = tab as Tabs;
    const attributesObject = currentTab?.data.datasetTab.statisticsTab.attributes as DatasetAttribute[];
    if (!attributesObject) return;
    const attributes = Object.values(attributesObject) as DatasetAttribute[];
    const labelAttribute = attributes.find((item) => item.role === DatasetAttributesRoles.LABEL);
    const survivalTimeAttribute =
      problemType === ProblemTypes.Survival
        ? attributes.find((item) => item.role === DatasetAttributesRoles.SURVIVAL_TIME)
        : null;

    return {
      label: labelAttribute?.name || null,
      survivalTime: survivalTimeAttribute?.name || null,
    };
  },
);
