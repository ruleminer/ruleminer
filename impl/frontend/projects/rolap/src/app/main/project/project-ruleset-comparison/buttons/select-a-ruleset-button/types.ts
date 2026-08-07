import { V2RulesTableData, V2RulesTableMeta } from '../../../../../common/store/v2RulesTable/types';

export type SelectedDataset = {
  id: number;
  name: string;
  data: {
    active: boolean;
  };
};

export type SelectedRuleSetModalData = {
  rulesetDataToCompare: V2RulesTableData;
  secondRuleset: {
    name: string;
    id: number;
    fullName: string;
  };
  rulesetMetaToCompare: V2RulesTableMeta;
};
