import { createSelector } from '@ngrx/store';

import { AppState, SubTabsNames } from '../app-state.model';
import { selectCurrentV2TabId } from '../v2CurrentTab/v2CurrentTab.selectors';
import { SubTabItem, TabTypes, V2Tab } from './types';
import { adapter } from './v2Tabs.reducer';

export const selectFeature = (state: AppState) => state.v2Tabs;

const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const memoSelectAllV2Tabs = createSelector(selectFeature, selectAll);

export const selectTabEntities = createSelector(selectFeature, selectEntities);

export const selectCurrentV2Tab = createSelector(
  selectTabEntities,
  selectCurrentV2TabId,
  (entities, currentId) => entities[currentId],
);

export const selectAllV2Tabs = createSelector(
  selectFeature,
  (state) => selectAll(state).filter((tab): tab is V2Tab => tab !== null), // Filtering out nulls
);

export const selectCurrentV2TabText = createSelector(selectCurrentV2Tab, (tab) => tab?.text);

export const selectCurrentV2TabDescription = createSelector(selectCurrentV2Tab, (tab) => tab?.description);

export const selectCurrentV2TabIds = createSelector(selectCurrentV2Tab, (tab) => tab?.ids);

export const selectCurrentV2TabDataSetText = createSelector(selectCurrentV2Tab, (tab) => tab?.datasetText);

export const selectCurrentV2TabType = createSelector(selectCurrentV2Tab, (tab) => tab?.type);

export const selectCurrentV2SubTabIndex = createSelector(selectCurrentV2Tab, (tab) => tab?.currentSubTabIndex);

export const selectCurrentSubTabs = createSelector(
  selectCurrentV2TabType,
  selectCurrentV2SubTabIndex,
  (tabType, activeIndex) => {
    let tabs: SubTabsNames[] = [];

    switch (tabType) {
      case TabTypes.DATA_SET:
        tabs = [SubTabsNames.DATASET, SubTabsNames.STATISTICS, SubTabsNames.CHARTS];
        break;
      case TabTypes.RULE_SET:
        tabs = [
          SubTabsNames.RULES,
          SubTabsNames.RULES_COVERAGE,
          SubTabsNames.RULE_COMPARISON,
          SubTabsNames.VISUALISATION,
          SubTabsNames.PREDICTION,
          SubTabsNames.PREDICTION_STATISTICS,
          SubTabsNames.EXAMPLE,
          SubTabsNames.DESCRIPTION,
        ];
        break;
      default:
        tabs = [];
        break;
    }

    return tabs.map((tab, index) => {
      const item: SubTabItem = {
        name: tab,
        active: index === activeIndex,
        text: 'project.tabs.' + tab,
        dataCy: 'sub-tab-btn-' + tab,
      };
      return item;
    });
  },
);

export const selectCurrentSubTabName = createSelector(
  selectCurrentSubTabs,
  (subTabs) => subTabs.find((subTab) => subTab.active)?.name,
);

export const selectAllOpenedTabIds = createSelector(selectAllV2Tabs, (tabs) => tabs.map((tab) => tab.id));
