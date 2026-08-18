import { Ids } from '../../../../../common/store/ruleSets/rulesets.selectors';

export interface ReachedObject {
  name: string;
  isReached: boolean;
  ids: Ids;
}

export interface Dataset {
  rulesets: ReachedObject[];
  report: ReachedObject[];
}

export interface DatasetList {
  [key: string]: Dataset;
}

export interface DisabledItem {
  name: string;
  disabled: boolean;
  ids?: Ids;
}

export type TranslateResponse = { treeview: { context_menu: { button: ButtonItems } } };

export type ButtonItems = {
  add_ruleset: string;
  compare: string;
  delete: string;
  duplicate: string;
  duplicate_with_related: string;
  edit: string;
  generate: string;
  generate_reports: string;
  import: string;
  split: string;
  filter: string;
  download: string;
};
