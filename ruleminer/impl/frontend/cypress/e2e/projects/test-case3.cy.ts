import { filterBuilder } from '@e2e-helpers/devexpress/filterBuilder';
import { projectRulesTable } from '@e2e-helpers/rolap/projectRulesTable/projectRulesTable';
import { rulesEditor } from '@e2e-helpers/rolap/rulesEditor';
import { treeview } from '@e2e-helpers/rolap/treeview';

import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums';

describe('Test case 3 (Classification) - Nested Rule: Condition1 AND (Condition2 OR Condition3)', () => {
  beforeEach(() => {
    cy.prepareTest();
    cy.createSampleProject(ProblemTypes.Classification);
  });

  it('should correctly create a rule with a nested OR group inside an AND group', () => {
    const ruleTexts = {
      condition1Only: 'IF hair = {False} THEN class = mammal',
      condition1AndCondition2InGroup: 'IF hair = {False} AND milk = {True} THEN class = mammal',
      finalRule_Condition1_AND_Condition2_OR_Condition3:
        'IF hair = {False} AND (milk = {True} OR eggs = {True}) THEN class = mammal',
    };
    treeview.openFirstRuleSet();
    rulesEditor.addNewRule();

    filterBuilder.addCondition();
    filterBuilder.fillConditionRow(0, {
      field: 'hair',
      operator: '=',
      value: 'False',
      valueInputTypeHint: 'select',
    });
    cy.wait(1000);
    rulesEditor.verifyRuleText(ruleTexts.condition1Only);
    cy.wait(1000);

    filterBuilder.addGroup();
    rulesEditor.verifyRuleText(ruleTexts.condition1Only);
    cy.wait(1000);

    const nestedGroupSelector = filterBuilder.selectors.conditionGroupByIndex(1);

    filterBuilder.addCondition(nestedGroupSelector);
    filterBuilder.fillConditionRow(
      0,
      {
        field: 'milk',
        operator: '=',
        value: 'True',
        valueInputTypeHint: 'select',
      },
      nestedGroupSelector,
    );
    rulesEditor.verifyRuleText(ruleTexts.condition1AndCondition2InGroup);
    cy.wait(1000);

    filterBuilder.setGroupCondition('OR', nestedGroupSelector);
    filterBuilder.addCondition(nestedGroupSelector);
    filterBuilder.fillConditionRow(
      1,
      {
        field: 'eggs',
        operator: '=',
        value: 'True',
        valueInputTypeHint: 'select',
      },
      nestedGroupSelector,
    );
    rulesEditor.verifyRuleText(ruleTexts.finalRule_Condition1_AND_Condition2_OR_Condition3);
    cy.wait(1000);

    rulesEditor.submitRule();
    rulesEditor.addRulesToTable();
    projectRulesTable.checkNColumnTextsInTable(4, ['hair = {False} AND (milk = {True} OR eggs = {True})']);
  });

  it('should create and modify rules correctly', () => {
    const ruleTexts = {
      initialRule: 'IF hair = {False} THEN class = mammal',
      modifiedRule: 'IF hair = {False} AND milk = {False} THEN class = mammal',
      secondCondition: 'milk',
      finalCondition: 'toothed',
    };
    treeview.openFirstRuleSet();
    rulesEditor.addNewRule();
    filterBuilder.addCondition();
    const rowIndex = 0;
    filterBuilder.fillConditionRow(rowIndex, {
      field: 'hair',
      operator: '=',
      value: 'False',
      valueInputTypeHint: 'select',
    });

    rulesEditor.verifyRuleText(ruleTexts.initialRule);
    cy.wait(10000);
    rulesEditor.submitRule();
    cy.wait(1000);
    rulesEditor.addRulesToTable();
    projectRulesTable.clickOnEditButtonInFirstElement(ProblemTypes.Classification);
    cy.wait(1000);
    filterBuilder.addCondition();
    cy.wait(3000);
    filterBuilder.fillConditionRow(1, {
      field: 'milk',
      operator: '=',
      value: 'False',
      valueInputTypeHint: 'select',
    });
    rulesEditor.verifyOriginalRuleText(ruleTexts.initialRule);
    rulesEditor.submitRule();
  });
});
