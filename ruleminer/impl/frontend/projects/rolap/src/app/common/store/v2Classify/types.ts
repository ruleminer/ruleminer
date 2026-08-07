import { EntityState } from '@ngrx/entity';

import { V2RulesTableData } from '../v2RulesTable/types';

export interface V2Classify {
  id: string; // NgRx entity store id
  cards: EntityState<V2ClassifyCard>;
}

export interface V2ClassifyCard {
  id: string; // nanoid()
  exampleTable: any[];
  exampleResult?: ExampleResult;
  showNeedsRecalculationInfo: boolean;
  calculatedBefore: boolean;
}

export interface ExampleResult {
  covering_rules: { [ruleId: string]: string };
  decision: string;
  resultTableData: V2RulesTableData;
}
