import { EntityState } from '@ngrx/entity';

import { SubTabsNames } from '../app-state.model';
import { Ids } from '../ruleSets/rulesets.selectors';

export type V2Tab = {
  id: string; //ngrx store id use generateNgrxKey() to generate
  ids: Ids;
  type: TabTypes;
  currentSubTabIndex: number;
  text: string;
  description: string;
  isSaved: boolean;
  datasetText: string;
};

export enum TabTypes {
  RULE_SET = 'ruleSet',
  DATA_SET = 'dataSet',
  REPORT = 'report',
  PROCESS = 'process',
  COMPARE = 'compare',
}

export type V2TabStateInterface = EntityState<V2Tab | null>;
export type V2TabState = EntityState<V2Tab>;

export type SubTabItem = {
  name: SubTabsNames;
  active: boolean;
  text: string;
  dataCy: string;
};
