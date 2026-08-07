import { RuleTableUse, SubTabsNames } from '../../../../../common/store/app-state.model';
import { V2RulesTableData } from '../../../../../common/store/v2RulesTable/types';
import { ProblemTypes } from '../../../../data-upload/utils/enums';

export type RuleVisibility = { uuid: string; ruleName: string };

export type DisplayType = SubTabsNames | RuleTableUse;

export type BigTableSettings = {
  showRefreshButton: boolean;
  isCompareTable: boolean;
  editable: boolean;
  dataFromApi: boolean;
  instanceSync: boolean;
  showSaveButton: boolean;
  showExportButton: boolean;
  contextMenu: boolean;
  selectRuleModal: boolean;
  addRulesButton: boolean;
  displayInCard: boolean;
  readonlyLabels: boolean;
  height: string | undefined;
  shouldDisplayTooltip: boolean;
  showUndoRedoButtons: boolean;
  showDisplayFilterRows: boolean;
};

export type ProjectRulesTableData = {
  dataSetText: string | undefined;
  v2RulesTableData: V2RulesTableData;
  ids: {
    ruleSetId: number;
    dataSetId: number;
    projectId: number;
  };
  typeOfProblem: ProblemTypes; // project problem type
  displayType: DisplayType;
  selectMultiple: boolean;
  rulesUuidsToDisplay: string[] | null;
  settings: BigTableSettings;
};
