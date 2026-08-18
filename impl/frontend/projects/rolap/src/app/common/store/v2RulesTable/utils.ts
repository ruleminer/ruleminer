import { isEqual } from 'lodash';

import { ProblemTypes } from '../../../main/data-upload/utils/enums';
import { RulesTableRow } from '../../../main/project/models/project';
import { EditedRow } from '../../../main/project/models/ruleset';
import { BaseConclusion } from '../../../main/project/project-rules/project-rules-table/project-rules-table-editor/rules-editor-side-column/rule-conclusion-editor/rule-conclusion-editor.component';

/**
 * Determines if a row has been edited by comparing premise and conclusion with the stored row.
 *
 * @param editedRow - The potentially edited row.
 * @param storeRow - The original row from the store.
 * @returns `true` if premise or conclusion properties differ; otherwise, `false`
 */
export const wasRowEdited = (editedRow: EditedRow, storeRow: any): boolean => {
  return !isEqual(editedRow.premise, storeRow.premise) || !isEqual(editedRow.conclusion, storeRow.conclusion);
};

/**
 * Prepares the conclusion value for display in the DataField.DisplayConclusion column.
 *
 * @param problemType - The type of problem (Classification, Regression, or other)
 * @param conclusion - The conclusion object containing the value to be processed
 * @returns
 * - For Classification: returns the string value from the conclusion object
 * - For Regression: returns the numeric value from the conclusion object
 * - For other types: returns the entire conclusion object unchanged
 */
export function makeDisplayConclusionValue(
  problemType: ProblemTypes,
  conclusion: BaseConclusion,
): BaseConclusion | string | number {
  if (problemType === ProblemTypes.Classification) {
    return conclusion.value;
  } else if (problemType === ProblemTypes.Regression) {
    return Number(conclusion.value);
  }
  return conclusion;
}

type Condition = {
  type: string;
  operator?: 'CONJUNCTION' | 'ALTERNATIVE';
  subconditions?: Condition[];
};

/**
 * Checks if any of the given rules contains an alternative condition.
 *
 * @param rules array of rules from rules table
 * @returns true if any rule contains an alternative condition.
 */
export function checkIfRuleSetContainsAlternatives(rules: RulesTableRow[]) {
  function checkIfConditionsContainsAlternatives(condition: Condition): boolean {
    if (condition.type === 'compound') {
      if (condition.operator === 'ALTERNATIVE') return true;
      return (
        condition.subconditions?.some((subcondition) => checkIfConditionsContainsAlternatives(subcondition)) ?? false
      );
    }
    return false;
  }

  return rules.some((rule) => checkIfConditionsContainsAlternatives(rule.premise));
}
