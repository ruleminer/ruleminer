import { createFeatureSelector, createSelector } from '@ngrx/store';
import { cloneDeep } from 'lodash';

import { ConditionsStringService } from '../../../main/project/service/conditions-string.service';
import { activeProjectSelector } from '../project/project.selectors';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import {
  selectCurrentV2RulesTable,
  selectCurrentV2RulesTableFilteredUuids,
  selectCurrentV2RulesTableMeta,
} from '../v2RulesTable/v2RulesTable.selectors';
import { selectCurrentV2TabIds } from '../v2Tabs/v2Tabs.selectors';
import { V2VisualizationTabState, v2visualizationTabAdapter } from './v2VisualizationTab.reducer';

const conditionsStringService = new ConditionsStringService();

const { selectEntities } = v2visualizationTabAdapter.getSelectors();
const feature = createFeatureSelector<V2VisualizationTabState>('v2VisualizationTab');

export const selectV2VisualizationTabEntities = createSelector(feature, selectEntities);

export const selectCurrentV2VisualizationTab = createSelector(
  selectV2VisualizationTabEntities,
  selectCurrentV2TabId,
  (entities, currentId) => {
    return entities[currentId];
  },
);

export const selectCurrentV2VisualizationTabRules = createSelector(
  selectCurrentV2VisualizationTab,
  (visualisationTab) => {
    if (!visualisationTab) {
      return [];
    }
    return visualisationTab.selectedRules || [];
  },
);

export const selectCurrentV2VisualizationTabSearchValue = createSelector(
  selectCurrentV2VisualizationTab,
  (visualisationTab) => {
    if (!visualisationTab) return null;
    return visualisationTab.searchValue || '';
  },
);

export const selectCurrentV2VisualizationTabHiddenRulesUUIDs = createSelector(
  selectCurrentV2VisualizationTab,
  (visualisationTab) => {
    if (!visualisationTab) return null;
    return visualisationTab.hiddenRulesUUIDs || [];
  },
);

export const selectCurrentV2VisualizationRulesList = createSelector(
  selectCurrentV2RulesTable,
  selectCurrentV2RulesTableMeta,
  selectCurrentV2RulesTableFilteredUuids,
  selectCurrentV2VisualizationTabRules,
  (v2RulesTable, v2RulesMeta, filteredRowsUuids, v2VisualizationTabRules) => {
    if (!v2RulesTable || !v2RulesMeta || !filteredRowsUuids || !v2VisualizationTabRules) {
      return [];
    }

    const filteredRules = v2RulesTable.data.filter((rule) => filteredRowsUuids.includes(rule.uuid));
    if (filteredRules.length === 0) return [];

    return filteredRules.map((rule, index) => {
      const selectedRule = v2VisualizationTabRules.find((sr) => sr.ruleUUid === rule.uuid);
      const ruleChecked = !!selectedRule;

      const subconditions = rule.premise.subconditions.map((sub: any, subIndex: number) => {
        const subChecked = selectedRule ? selectedRule.selectedSubconditionIndexes.includes(subIndex) : false;
        return {
          ...sub,
          text: conditionsStringService.generateConditionsString(sub, v2RulesMeta.attributes),
          checked: subChecked,
          index: subIndex,
        };
      });

      return {
        ...cloneDeep(rule),
        index,
        premise: {
          ...rule.premise,
          subconditions,
        },
        checked: ruleChecked,
      };
    });
  },
);

export const selectCurrentV2VisualizationRulesListFilteredBySearchValue = (translatedRule: string) =>
  createSelector(
    selectCurrentV2VisualizationRulesList,
    selectCurrentV2VisualizationTabSearchValue,
    (rules, searchValue) => {
      const value = searchValue || '';
      const filterLowerCase = value.trim().toLowerCase();

      return filterLowerCase.length === 0
        ? [...rules]
        : rules.filter(
            (rule) =>
              rule.string.toLowerCase().includes(filterLowerCase) ||
              `${translatedRule} ${rule.index + 1}`.toLowerCase().includes(filterLowerCase),
          );
    },
  );

export const selectCurrentV2VisualizationTabShowSomeRulesWereUnselectedInfo = createSelector(
  selectCurrentV2VisualizationTab,
  (visualisationTab) => {
    if (!visualisationTab) return false;
    return visualisationTab.showSomeRulesWereUnselectedInfo || false;
  },
);

export const isLoadingCurrentV2Visualization = createSelector(
  selectCurrentV2VisualizationRulesList,
  (visualisationTab) => {
    if (!visualisationTab.length) {
      return true;
    }
    return false;
  },
);

export const selectCurrentV2VisualizationTabSelectedGraphNodes = createSelector(
  selectCurrentV2VisualizationTab,
  (visualisationTab) => {
    if (!visualisationTab) return null;
    return visualisationTab.selectedGraphNodes || null;
  },
);

export const selectCurrentV2VisualizationTabGraphData = createSelector(
  selectCurrentV2RulesTableMeta,
  selectCurrentV2VisualizationRulesList,
  activeProjectSelector,
  selectCurrentV2TabIds,
  (v2RulesMeta, visualizationTabRulesList, project, ids) => {
    if (!v2RulesMeta || !project || !ids) {
      return null;
    }

    const data = null;
    const dataSetId = ids.dataSetId!;
    const graphOptions = {
      calculateCoverage: true,
      fullScreen: false,
      rules: visualizationTabRulesList,
      meta: v2RulesMeta,
      ids: { dataSetId: dataSetId, projectId: project.id },
      project: project,
      data: data,
    };

    return {
      dataSetId,
      data,
      project,
      meta: v2RulesMeta,
      rules: visualizationTabRulesList,
      graphOptions,
    };
  },
);
