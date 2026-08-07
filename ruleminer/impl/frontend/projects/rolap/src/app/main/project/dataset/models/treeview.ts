import { Ids } from '../../../../common/store/ruleSets/rulesets.selectors';
import { RolapItemTypes } from '../../../../common/store/v2Tabs/utils';

export interface TreeViewItem {
  id: string;
  text: string;
  type?: RolapItemTypes;
  project_id: number;
  dataset_id?: number;
  ruleset_id?: number;
  report_id?: number;
  items?: TreeViewItem[];
  is_active?: boolean;
  limit_reached?: boolean;
}

export interface MappedItem {
  id: string;
  text: string;
  expanded: boolean;
  ids: Ids;
  type?: RolapItemTypes;
  items?: MappedItem[];
  isDisabled: boolean;
  datasetText?: string;
  limitReached?: boolean;
}

export type TreeView = MappedItem[];
