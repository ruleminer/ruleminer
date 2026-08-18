import { Ids } from "../../../../common/store/ruleSets/rulesets.selectors";
import { RolapItemTypes } from "../../../../common/store/v2Tabs/utils";

export interface TreeNode {
  ids: Ids;
  type: RolapItemTypes | undefined;
}

export enum ReportTypeMenuItem {
  EDA = 'EDA',
  WHITEBOX = 'WHITEBOX',
  PREDICTION = 'PREDICTION',
}