export interface V2VisualizationTab {
  id: string; // NgRx entity store id
  searchValue: string;
  selectedRules: selectedRuleV2VisualizationTab[];
  hiddenRulesUUIDs: string[];
  showSomeRulesWereUnselectedInfo: boolean;
  selectedGraphNodes: SelectedGraphNodes;
}

export type selectedRuleV2VisualizationTab = {
  ruleUUid: string;
  selectedSubconditionIndexes: number[];
};

export type SelectedGraphNodes = GraphNode[];

type GraphNode = {
  ruleUUid: string;
  left: number | null;
  type: string;
  right: number | null;
  negated: boolean;
  attributes: number[];
  left_closed: boolean;
  right_closed: boolean;
  text: string;
  checked: boolean;
  index: number;
  coverage_importance: string[];
};
