import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { MappedItem } from '../../../main/project/dataset/models/treeview';
import { TreeNode } from '../../../main/project/dataset/treeview/types';
import { Project } from '../../../main/project/models/project';

export const ProjectActions = createActionGroup({
  source: 'Project',
  events: {
    'Set Active Project': props<{ activeProject: Project }>(),
    'Set Active Project Complete': props<{ activeProject: Project }>(),

    'Add Expanded Node': props<{ node: TreeNode }>(),
    'Remove Expanded Node': props<{ node: TreeNode }>(),
    'Expand All Tree Nodes': emptyProps(),

    'Trigger Read Tree Expanded Nodes': emptyProps(),
    'Signal Tree Data Refresh': emptyProps(),

    'Load Tree Data': props<{ projectId: number }>(),
    'Load Tree Data Success': props<{ treeData: MappedItem[] }>(),
    'Load Tree Data Failure': props<{ error: any }>(),

    'Open First DataSet In Project': emptyProps(),
  },
});
