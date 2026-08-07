import { createReducer, createSelector, on } from '@ngrx/store';

import { hasSameIds } from '../../../main/data-upload/utils/utils';
import { AppState, DataSetTab, ProcessTab, RefreshAllState, ReportTab, RuleSetTab, Tabs } from '../app-state.model';
import { generateNgrxKey, isDataSetV2, isReportV2, isRuleSetV2 } from '../v2Tabs/utils';
import {
  loadDatasetStatistics,
  loadPredictionCrossValidation,
  loadPredictionGeneralIndicators,
  loadPredictionIndicators,
  loadPredictionIndicatorsTestData,
  loadRuleAttributesAndConditionImportance,
  loadRulePredictionIndicators,
  loadRuleQuantitativeCharacteristics,
  predictionIndicatorsRefreshAllChange,
  predictionIndicatorsTestDataRefresh,
  predictionIndicatorsTrainingDataRefresh,
  ruleSetAttributesImportanceStateChange,
  ruleSetConditionImportanceStateChange,
  ruleSetImportanceRefreshChange,
  ruleSetPredictionIndicatorsRefreshChange,
  ruleSetPredictionIndicatorsStateChange,
  ruleSetQuantitativeCharacteristicsRefreshChange,
  ruleSetQuantitativeCharacteristicsStateChange,
  rulesRefreshAllChange,
  rulesetEdited,
  setHistogramVisualisationTab,
  setIsLoadingPredictionIndicators,
  setIsLoadingQuantitativeCharacteristics,
  setIsLoadingRuleAttributesAndConditionImportance,
  setSelecteDataSetForPredictionIndicatorsTestCard,
} from './rulesets.action';
import { getCurentTabBasedOnv2CurrentTab } from './rulesets.selectors';
import { TabsActions } from './tabs.action';

const initialState: Tabs[] = [];

export function removeIfAndThenFromRule(ruleString: string): string {
  if (ruleString.startsWith('IF ') && ruleString.includes(' THEN ')) {
    return ruleString
      .split(' THEN ')[0]
      .substring(3)
      .replaceAll('!=', '≠')
      .trim();
  }
  return ruleString;
}

export const tabReducer = createReducer(
  initialState,
  on(TabsActions.clearTabs, (state) => []),

  on(TabsActions.addRuleSet, (state, { tab }) => {
    const isAlreadyInState = state.some((someTab) => someTab.id === tab.id);
    if (isAlreadyInState || !isRuleSetV2(tab.id)) return [...state];
    return [...state, tab];
  }),

  on(TabsActions.addDataSet, (state, { tab }) => {
    const isAlreadyInState = state.some((someTab) => someTab.id === tab.id);
    if (isAlreadyInState || !isDataSetV2(tab.id)) return [...state];
    return [...state, tab];
  }),

  on(TabsActions.addReport, (state, { tab }) => {
    const isAlreadyInState = state.some((someTab) => someTab.id === tab.id);
    if (isAlreadyInState || !isReportV2(tab.id)) return [...state];
    return [...state, tab];
  }),

  on(TabsActions.addProcess, (state) => {
    const isAlreadyInState = state.some((someTab) => someTab.id === 'process');
    const tab: ProcessTab = {
      id: 'process',
    };
    if (isAlreadyInState) return [...state];
    return [...state, tab];
  }),

  on(TabsActions.addCompare, (state, { tab }) => {
    const isAlreadyInState = state.some((someTab) => someTab.id === tab.id);
    if (isAlreadyInState) return [...state];
    return [...state, tab];
  }),

  on(TabsActions.closeTab, (state, { v2TabKey, v2CurrentTabId }) => {
    const index = state.findIndex((x) => x.id === v2TabKey);
    const isClosedTabCurrent = state[index].id === v2CurrentTabId;

    let newState = [...state.slice(0, index), ...state.slice(index + 1)];
    if (!isClosedTabCurrent) return newState;

    // If there are previous tabs, set the previous one as the current tab.
    if (newState.length && index > 0) {
      newState = newState.map((item, i) => ({ ...item }));
    }

    return newState;
  }),

  on(TabsActions.closeMultipleTabs, (state, { v2TabIdArr }) => {
    let newState = state;
    const isCurrentTabRemoved = false;

    for (let i = 0; i < v2TabIdArr.length; i++) {
      let index: number;

      index = newState.findIndex((x) => x.id === v2TabIdArr[i]);

      if (index > -1) {
        newState = [...newState.slice(0, index), ...newState.slice(index + 1)];
      }
    }

    if (isCurrentTabRemoved && newState.length) {
      newState[0] = { ...newState[0] };
    }

    return newState;
  }),

  on(rulesetEdited, (state, { data }) => {
    // const currentTabIndex = state.findIndex((tab: Tabs) => tab.isCurrent);
    const currentTabIndex = 1; //todo fix this
    if (currentTabIndex < 0) return state;
    const newState = [...state];
    newState[currentTabIndex] = data;
    return newState;
  }),

  on(loadRulePredictionIndicators, (state, { data }) => {
    const newState = state.map((item) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const newData = {
        ...item.data,
        rulesTab: {
          ...item.data.rulesTab,
          predictionIndicators: {
            ...item.data.rulesTab.predictionIndicators,
            table: { ...data.data },
          },
        },
      };
      return { ...item, data: newData };
    });

    return newState;
  }),
  on(loadRuleQuantitativeCharacteristics, (state, { data }) => {
    const newState = state.map((item) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const newData = {
        ...item.data,
        rulesTab: {
          ...item.data.rulesTab,
          quantitativeCharacteristics: {
            ...item.data.rulesTab.quantitativeCharacteristics,
            table: { ...data.data },
          },
        },
      };
      return { ...item, data: newData };
    });
    return newState;
  }),

  on(loadPredictionGeneralIndicators, (state, { data }) => {
    const newState = state.map((item) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const newData = {
        ...item.data,
        predictionTab: {
          ...item.data.predictionTab,
          generalIndicators: { ...data.data },
        },
      };
      return { ...item, data: newData };
    });

    return newState;
  }),
  on(loadRuleAttributesAndConditionImportance, (state, { data }) => {
    const newState = state.map((item) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const newData = {
        ...item.data,
        rulesTab: {
          ...item.data.rulesTab,
          importance: {
            ...item.data.rulesTab.importance,
            conditionImportance: {
              ...item.data.rulesTab.importance.conditionImportance,
              table: { ...data.data.condition_importance },
            },
            attributesImportance: {
              ...item.data.rulesTab.importance.attributesImportance,
              table: { ...data.data.attribute_importance },
            },
          },
        },
      };
      return { ...item, data: newData };
    });
    return newState;
  }),
  on(loadPredictionIndicators, (state, { data }) => {
    const newState = state.map((item) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const newData = {
        ...item.data,
        predictionTab: {
          ...item.data.predictionTab,
          predictionIndicators: { ...data.data },
        },
      };
      return { ...item, data: newData };
    });
    return newState;
  }),

  on(predictionIndicatorsRefreshAllChange, (state, { data }) => {
    const newState = state.map((item) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const newData = {
        ...item.data,
        predictionTab: {
          ...item.data.predictionTab,
          refreshAll: data.refreshAll,
        },
      };
      return { ...item, data: newData };
    });

    return newState;
  }),
  on(rulesRefreshAllChange, (state, { data }) => {
    const newState = state.map((item) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const newData = {
        ...item.data,
        rulesTab: {
          ...item.data.rulesTab,
          refreshAll: data.refreshAll,
        },
      };
      return { ...item, data: newData };
    });

    return newState;
  }),
  on(predictionIndicatorsTrainingDataRefresh, (state, { data }) => {
    const newState = state.map((item) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const newData = {
        ...item.data,
        predictionTab: {
          ...item.data.predictionTab,
          trainingDataRefresh: data.needsRefresh,
        },
      };
      return { ...item, data: newData };
    });
    return newState;
  }),
  on(predictionIndicatorsTestDataRefresh, (state, { data }) => {
    const newState = state.map((item) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const newData = {
        ...item.data,
        predictionTab: {
          ...item.data.predictionTab,
          testCard: {
            ...item.data.predictionTab.testCard,
            refresh: data.needsRefresh,
          },
        },
      };
      return { ...item, data: newData };
    });
    return newState;
  }),
  on(loadPredictionIndicatorsTestData, (state, { data }) => {
    const newState = state.map((item) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const newData = {
        ...item.data,
        predictionTab: {
          ...item.data.predictionTab,
          testCard: {
            ...item.data.predictionTab.testCard,
            refresh: false,
            data: data.data,
          },
        },
      };
      return { ...item, data: newData };
    });
    return newState;
  }),
  on(setSelecteDataSetForPredictionIndicatorsTestCard, (state, { data }) => {
    const newState = state.map((item) => {
      if (!hasSameIds(item, data.ids, 'ruleSet') || !data.selectedDataSet) return item;
      const newData = {
        ...item.data,
        predictionTab: {
          ...item.data.predictionTab,
          testCard: {
            ...item.data.predictionTab.testCard,
            selectedDataSet: data.selectedDataSet,
          },
        },
      };
      return { ...item, data: newData };
    });
    return newState;
  }),
  on(loadPredictionCrossValidation, (state, { data }) => {
    const newState = state.map((item) => {
      if (!isRuleSetV2(item.id)) return item;
      const ruleSetItem = item as RuleSetTab;
      if (ruleSetItem.id === data.v2TabId) {
        const newData = {
          ...ruleSetItem.data,
          predictionTab: {
            ...ruleSetItem.data.predictionTab,
            crossValidation: { ...data.data },
          },
        };
        return { ...ruleSetItem, data: newData };
      }
      return ruleSetItem;
    });
    return newState;
  }),
  on(ruleSetPredictionIndicatorsStateChange, (state, { data }) => {
    return state.map((item: Tabs) => {
      if (!isRuleSetV2(item.id)) return item;
      const ruleSetItem = item as RuleSetTab;
      if (ruleSetItem.id === data.v2TabId) {
        const updatedData = {
          ...ruleSetItem.data,
          rulesTab: {
            ...ruleSetItem.data.rulesTab,
            predictionIndicators: {
              ...ruleSetItem.data.rulesTab.predictionIndicators,
              state: data.state,
            },
          },
        };
        return { ...ruleSetItem, data: updatedData };
      }
      return ruleSetItem;
    });
  }),

  on(setHistogramVisualisationTab, (state, { data }) => {
    const newState = state.map((item) => {
      if (!isRuleSetV2(item.id)) return item;
      const ruleSetItem = item as RuleSetTab;
      const v2TabId = generateNgrxKey(data.projectId, data.dataSetId, data.ruleSetId, 0, 'ruleSet');
      if (ruleSetItem.id === v2TabId) {
        return {
          ...ruleSetItem,
          data: {
            ...ruleSetItem.data,
            histogramTab: {
              attribute_importance: data.histogramTab.attribute_importance,
              condition_importance: data.histogramTab.condition_importance,
              maxAttributeElements: data.histogramTab.maxAttributeElements,
              maxConditionElements: data.histogramTab.maxConditionElements,
              attribute_plot_type: data.histogramTab.attribute_plot_type,
            },
          },
        };
      }
      return ruleSetItem;
    });
    return newState;
  }),
  on(ruleSetQuantitativeCharacteristicsStateChange, (state, { data }) => {
    return state.map((item: Tabs) => {
      if (!isRuleSetV2(item.id)) return item;
      const ruleSetItem = item as RuleSetTab;
      if (ruleSetItem.id === data.v2TabId) {
        const updatedData = {
          ...ruleSetItem.data,
          rulesTab: {
            ...ruleSetItem.data.rulesTab,
            quantitativeCharacteristics: {
              ...ruleSetItem.data.rulesTab.quantitativeCharacteristics,
              state: data.state,
            },
          },
        };
        return { ...ruleSetItem, data: updatedData };
      }
      return ruleSetItem;
    });
  }),
  on(ruleSetConditionImportanceStateChange, (state, { data }) => {
    return state.map((item: Tabs) => {
      if (!isRuleSetV2(item.id)) return item;
      const ruleSetItem = item as RuleSetTab;
      if (ruleSetItem.id === data.v2TabId) {
        const updatedData = {
          ...ruleSetItem.data,
          rulesTab: {
            ...ruleSetItem.data.rulesTab,
            importance: {
              ...ruleSetItem.data.rulesTab.importance,
              conditionImportance: {
                ...ruleSetItem.data.rulesTab.importance.conditionImportance,
                state: data.state,
              },
            },
          },
        };
        return { ...ruleSetItem, data: updatedData };
      }
      return ruleSetItem;
    });
  }),

  on(ruleSetAttributesImportanceStateChange, (state, { data }) => {
    return state.map((item: Tabs) => {
      if (!isRuleSetV2(item.id)) return item;
      const ruleSetItem = item as RuleSetTab;
      if (ruleSetItem.id === data.v2TabId) {
        const updatedData = {
          ...ruleSetItem.data,
          rulesTab: {
            ...ruleSetItem.data.rulesTab,
            importance: {
              ...ruleSetItem.data.rulesTab.importance,
              attributesImportance: {
                ...ruleSetItem.data.rulesTab.importance.attributesImportance,
                state: data.state,
              },
            },
          },
        };
        return { ...ruleSetItem, data: updatedData };
      }
      return ruleSetItem;
    });
  }),

  on(ruleSetPredictionIndicatorsRefreshChange, (state, { data }) => {
    return state.map((item: Tabs) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const updatedData = {
        ...item.data,
        rulesTab: {
          ...item.data.rulesTab,
          predictionIndicators: {
            ...item.data.rulesTab.predictionIndicators,
            refresh: data.needsRefresh,
          },
        },
      };
      return { ...item, data: updatedData };
    });
  }),

  on(ruleSetQuantitativeCharacteristicsRefreshChange, (state, { data }) => {
    return state.map((item: Tabs) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const updatedData = {
        ...item.data,
        rulesTab: {
          ...item.data.rulesTab,
          quantitativeCharacteristics: {
            ...item.data.rulesTab.quantitativeCharacteristics,
            refresh: data.needsRefresh,
          },
        },
      };
      return { ...item, data: updatedData };
    });
  }),

  on(ruleSetImportanceRefreshChange, (state, { data }) => {
    return state.map((item: Tabs) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const updatedData = {
        ...item.data,
        rulesTab: {
          ...item.data.rulesTab,
          importance: {
            ...item.data.rulesTab.importance,
            refresh: data.needsRefresh,
          },
        },
      };
      return { ...item, data: updatedData };
    });
  }),
  on(loadDatasetStatistics, (state, { data }) => {
    const newState = state.map((item) => {
      if (!isDataSetV2(item.id)) return item;
      const dataSetItem = item as DataSetTab;
      if (dataSetItem.id === data.v2TabId) {
        const newData = {
          ...dataSetItem.data,
          datasetTab: {
            ...dataSetItem.data.datasetTab,
            statisticsTab: { ...data.data },
          },
        };
        return { ...dataSetItem, data: newData };
      }
      return dataSetItem;
    });
    return newState;
  }),

  on(setIsLoadingRuleAttributesAndConditionImportance, (state, { data }: any) => {
    return state.map((item: Tabs) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const updatedData = {
        ...item.data,
        rulesTab: {
          ...item.data.rulesTab,
          importance: {
            ...item.data.rulesTab.importance,
            isLoading: data.isLoading,
          },
        },
      };
      return { ...item, data: updatedData };
    });
  }),

  on(setIsLoadingPredictionIndicators, (state, { data }: any) => {
    return state.map((item: Tabs) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const updatedData = {
        ...item.data,
        rulesTab: {
          ...item.data.rulesTab,
          predictionIndicators: {
            ...item.data.rulesTab.predictionIndicators,
            state: data.data,
            isLoading: data.isLoading,
          },
        },
      };
      return { ...item, data: updatedData };
    });
  }),

  on(setIsLoadingQuantitativeCharacteristics, (state, { data }: any) => {
    return state.map((item: Tabs) => {
      if (!hasSameIds(item, data.ids, 'ruleSet')) return item;
      const updatedData = {
        ...item.data,
        rulesTab: {
          ...item.data.rulesTab,
          quantitativeCharacteristics: {
            ...item.data.rulesTab.quantitativeCharacteristics,
            state: data.data,
            isLoading: data.isLoading,
          },
        },
      };
      return { ...item, data: updatedData };
    });
  }),
);

export const ruleSelector = createSelector(
  (state: AppState) => state.tabs,
  (tabs: Tabs[]) => tabs,
);

export const getCurentTab = () =>
  createSelector(getCurentTabBasedOnv2CurrentTab, (tab) => {
    return tab as any as Tabs;
  });

export const selectRefreshAll = createSelector(getCurentTabBasedOnv2CurrentTab, (tab) => {
  const state = tab?.data?.rulesTab?.refreshAll || RefreshAllState.HIDDEN;
  return state;
});

export const selectRefreshPredictionIndicatorsAll = createSelector(getCurentTabBasedOnv2CurrentTab, (tab) => {
  const state = tab?.data?.predictionTab?.refreshAll || RefreshAllState.HIDDEN;
  return state;
});

export const selectRefreshBtnState = createSelector(getCurentTabBasedOnv2CurrentTab, (tab) => {
  const state = tab?.data?.rulesTab?.refreshAll || RefreshAllState.HIDDEN;
  return state;
});

export const getCurrentRuleSetTab = () =>
  createSelector(getCurentTabBasedOnv2CurrentTab, (tab) => {
    return tab as RuleSetTab;
  });

export const getCurrentReportTab = () =>
  createSelector(getCurentTabBasedOnv2CurrentTab, (tab) => {
    return tab as ReportTab;
  });
