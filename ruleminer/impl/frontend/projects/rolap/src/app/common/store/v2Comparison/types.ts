import { RuleSimilarity } from '../../../main/project/models/ruleset';
import { PreparedRule } from '../../../main/project/project-ruleset-comparison/types';
import { SelectBoxItem } from '../../components/buttons/select-box/types';
import { V2RulesTableData, V2RulesTableMeta } from '../v2RulesTable/types';

export type V2Comparison = {
  id: string; //ngrx store id
  formState: V2ComparisonForm;
  dropDownItems: SelectBoxItem[];
  secondRuleset: {
    name: string;
    id: number;
    fullName: string;
  };
  rulesetDataToCompare: V2RulesTableData | null;
  rulesetMetaToCompare: V2RulesTableMeta | null;
  selectedRowsUUIDs: string[];
  showSomethingChangeWarning: boolean;
  calculatedData:
    | {
        premiseOneAutoIncrement: number;
        premise1: string;
        premiseTwoAutoIncrement: number;
        premise2: string;
        similarity: number;
      }[]
    | null;
  chartData: {
    ruleSimilarity: RuleSimilarity;
    rulesetOne: PreparedRule[];
    rulesetTwo: PreparedRule[];
    relationType: boolean;
    firstRulesetName: string;
    secondRulesetName: string;
  } | null;
};

export type V2ComparisonForm = {
  similarityType: boolean;
  relationType: boolean;
  comparisonMeasures: string | null;
};
