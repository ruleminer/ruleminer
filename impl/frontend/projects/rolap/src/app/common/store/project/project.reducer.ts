import { createReducer, on } from '@ngrx/store';

import { MappedItem } from '../../../main/project/dataset/models/treeview';
import { TreeNode } from '../../../main/project/dataset/treeview/types';
import { ProjectState } from '../app-state.model';
import { isDataSet, isReportGroup, isRuleSetGroup } from '../v2Tabs/utils';
import { ProjectActions } from './project.action';

const initialState: ProjectState = {
  activeProject: null as any,
  treeExpandedNodes: [],
  treeDataRefreshTrigger: 0,
  expandedNodesReadTrigger: 0,

  treeData: null,
  isTreeDataLoading: false,
  treeDataError: null,
};

export const projectReducer = createReducer(
  initialState,
  on(ProjectActions.setActiveProject, (state, { activeProject }) => ({
    ...state,
    activeProject: activeProject,
    treeExpandedNodes: [],
    treeDataRefreshTrigger: 0,
    expandedNodesReadTrigger: 0,

    treeData: null,
    isTreeDataLoading: false,
    treeDataError: null,
  })),

  on(ProjectActions.setActiveProjectComplete, (state, { activeProject }) => ({
    activeProject: activeProject,
    treeExpandedNodes: [],
    treeDataRefreshTrigger: 0,
    expandedNodesReadTrigger: 0,

    treeData: null,
    isTreeDataLoading: false,
    treeDataError: null,
  })),

  on(ProjectActions.addExpandedNode, (state, { node }) => {
    let type = node.type;
    let ids = node.ids;
    if (type === 'ruleSet') {
      type = 'rulesets_group';
      ids = {
        projectId: node.ids.projectId,
        dataSetId: node.ids.dataSetId,
      };
    }

    if (['report', 'EDA', 'WHITEBOX', 'PREDICTION'].includes(type as string)) {
      type = 'reports_group';
      ids = {
        projectId: node.ids.projectId,
        dataSetId: node.ids.dataSetId,
      };
    }
    if (type === 'dataSet') {
      ids = {
        projectId: node.ids.projectId,
        dataSetId: node.ids.dataSetId,
      };
    }
    const mappedNode = {
      ...node,
      type: type,
      ids: ids,
    };

    const alreadyExists = state.treeExpandedNodes.some(
      (n) =>
        n.ids.projectId === mappedNode.ids.projectId &&
        n.ids.dataSetId === mappedNode.ids.dataSetId &&
        n.ids.ruleSetId === mappedNode.ids.ruleSetId &&
        n.ids.reportId === mappedNode.ids.reportId &&
        n.type === mappedNode.type,
    );
    if (alreadyExists) return state;
    return {
      ...state,
      treeExpandedNodes: [mappedNode, ...state.treeExpandedNodes],
    };
  }),

  on(ProjectActions.removeExpandedNode, (state, { node }) => {
    let type = node.type;
    let ids = node.ids;
    if (type === 'ruleSet') {
      type = 'rulesets_group';
      ids = {
        projectId: node.ids.projectId,
        dataSetId: node.ids.dataSetId,
      };
    }
    if (type === 'report') {
      type = 'reports_group';
      ids = {
        projectId: node.ids.projectId,
        dataSetId: node.ids.dataSetId,
      };
    }
    if (type === 'dataSet') {
      ids = {
        projectId: node.ids.projectId,
        dataSetId: node.ids.dataSetId,
      };
    }
    const mappedNode = {
      ...node,
      type: type,
      ids: ids,
    };

    let newExpandedNodes = state.treeExpandedNodes.filter(
      (n) =>
        !(
          n.ids.projectId === mappedNode.ids.projectId &&
          n.ids.dataSetId === mappedNode.ids.dataSetId &&
          n.ids.ruleSetId === mappedNode.ids.ruleSetId &&
          n.ids.reportId === mappedNode.ids.reportId &&
          n.type === mappedNode.type
        ),
    );

    // If we're removing a dataset, also remove all rulesets and report groups with the same dataset ID
    if (mappedNode.type && isDataSet(mappedNode.type)) {
      newExpandedNodes = newExpandedNodes.filter((n) => {
        // Remove direct child groups (rulesets and reports groups)
        const isChildGroupOfNode =
          n.ids.projectId === mappedNode.ids.projectId &&
          n.ids.dataSetId === mappedNode.ids.dataSetId &&
          (n.ids.ruleSetId === undefined || n.ids.ruleSetId === 0) &&
          (n.ids.reportId === undefined || n.ids.reportId === 0) &&
          n.type &&
          (isRuleSetGroup(n.type) || isReportGroup(n.type));

        // Remove all rulesets and reports that belong to this dataset
        const isRulesetOrReportInDataset =
          n.ids.projectId === mappedNode.ids.projectId && n.ids.dataSetId === mappedNode.ids.dataSetId;

        return !isChildGroupOfNode && !isRulesetOrReportInDataset;
      });
    }

    return {
      ...state,
      treeExpandedNodes: newExpandedNodes,
    };
  }),

  on(ProjectActions.signalTreeDataRefresh, (state) => ({
    ...state,
    treeDataRefreshTrigger: state.treeDataRefreshTrigger + 1,
  })),

  on(ProjectActions.triggerReadTreeExpandedNodes, (state) => ({
    ...state,
    expandedNodesReadTrigger: state.expandedNodesReadTrigger + 1,
  })),

  on(ProjectActions.expandAllTreeNodes, (state) => {
    if (!state.treeData) return state;

    const extractAllExpandableNodes = (items: MappedItem[], nodes: TreeNode[] = []): TreeNode[] => {
      items.forEach((item) => {
        if (item.type && item.ids) {
          if (item.items && item.items.length > 0) {
            nodes.push({
              ids: item.ids,
              type: item.type,
            });
          }

          if (item.items) {
            extractAllExpandableNodes(item.items, nodes);
          }
        }
      });
      return nodes;
    };

    const allExpandableNodes = extractAllExpandableNodes(state.treeData);

    const processedNodes = allExpandableNodes.map((node) => {
      let type = node.type;
      let ids = node.ids;

      if (type === 'ruleSet') {
        type = 'rulesets_group';
        ids = {
          projectId: node.ids.projectId,
          dataSetId: node.ids.dataSetId,
        };
      }

      if (['report', 'EDA', 'WHITEBOX', 'PREDICTION'].includes(type as string)) {
        type = 'reports_group';
        ids = {
          projectId: node.ids.projectId,
          dataSetId: node.ids.dataSetId,
        };
      }

      if (type === 'dataSet') {
        ids = {
          projectId: node.ids.projectId,
          dataSetId: node.ids.dataSetId,
        };
      }

      return { ids, type };
    });

    const uniqueNodes = processedNodes.filter(
      (node, index, self) =>
        index === self.findIndex((n) => JSON.stringify(n.ids) === JSON.stringify(node.ids) && n.type === node.type),
    );

    return {
      ...state,
      treeExpandedNodes: [...state.treeExpandedNodes, ...uniqueNodes].filter(
        (node, index, self) =>
          index === self.findIndex((n) => JSON.stringify(n.ids) === JSON.stringify(node.ids) && n.type === node.type),
      ),
    };
  }),

  on(ProjectActions.loadTreeData, (state, { projectId: _projectId }) => ({
    ...state,
    isTreeDataLoading: true,
    treeDataError: null,
  })),

  on(ProjectActions.loadTreeDataSuccess, (state, { treeData }) => {
    return {
      ...state,
      isTreeDataLoading: false,
      treeData: treeData,
      treeDataError: null,
    };
  }),

  on(ProjectActions.loadTreeDataFailure, (state, { error }) => ({
    ...state,
    isTreeDataLoading: false,
    treeDataError: error,
    treeData: null,
  })),

  on(ProjectActions.openFirstDataSetInProject, (state) => state),
);
