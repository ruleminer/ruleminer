import { createSelector } from "@ngrx/store";
import { AppState, ProjectState } from "../app-state.model";
import { MappedItem } from "../../../main/project/dataset/models/treeview";

export const activeProjectSelector = createSelector(
  (state: AppState) => state.project,
  (project: ProjectState) => project.activeProject,
);

export const activeProjectProblemTypeSelector = createSelector(
  (state: AppState) => state.project,
  (project: ProjectState) => project?.activeProject?.type_of_problem,
);

export const activeSurvivalProjectSelector = createSelector(
  (state: AppState) => state.project,
  (project: ProjectState) => project.activeProject.type_of_problem === 'survival',
);

export const selectTreeExpandedNodes = createSelector(
  (state: AppState) => state.project,
  (project: ProjectState) => {
    if (project.isTreeDataLoading) return null
    if(project.treeData === null) return null
    return project.treeExpandedNodes
  },
);

export const selectTreeDataRefreshTrigger = createSelector(
  (state: AppState) => state.project,
  (project: ProjectState) => project.treeDataRefreshTrigger
);

export const selectExpandedNodesReadTrigger = createSelector(
  (state: AppState) => state.project,
  (project: ProjectState) => {
    if (project.isTreeDataLoading) return null
    if(project.treeData === null) return null
    return project.expandedNodesReadTrigger
  }
);

export const selectTreeData = createSelector(
  (state: AppState) => state.project,
  (project: ProjectState): MappedItem[] | null => project.treeData
);

export const selectIsTreeDataLoading = createSelector(
  (state: AppState) => state.project,
  (project: ProjectState): boolean => project.isTreeDataLoading
);

export const selectTreeDataError = createSelector(
  (state: AppState) => state.project,
  (project: ProjectState): any | null => project.treeDataError
);

export const selectNumberOfDatasetsInTree = createSelector(
  selectTreeData,
  (treeData) => {
    if (!treeData || !treeData.length || !treeData[0].items) {
      return 0;
    }
    return treeData[0].items.length;
  }
);

export const selectFirstDataSetFromTree = createSelector(
  selectTreeData,
  (treeData) => {
    if (!treeData || !treeData[0] || !treeData[0].items) return null;
    const firstActiveDataSet = treeData[0].items.find((x) => x.isDisabled === false);
    if (!firstActiveDataSet) return null;
    const ids = firstActiveDataSet?.ids;
    const text = firstActiveDataSet?.text;
    return { ids, text };
  }
);
