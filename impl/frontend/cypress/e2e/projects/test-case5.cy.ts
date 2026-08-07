import { ProjectRulesTable } from '@e2e-helpers/rolap/projectRulesTable/projectRulesTable';
import { rulesCoverageTable } from '@e2e-helpers/rolap/rulesCoverageTable';
import { subTabButtons } from '@e2e-helpers/rolap/subTabButtons';
import { treeview } from '@e2e-helpers/rolap/treeview';

import { SubTabsNames } from '../../../projects/rolap/src/app/common/store/app-state.model';
import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums';

describe('Create and delete sample classification project', () => {
  beforeEach(() => {
    cy.prepareTest();
    cy.createSampleProject(ProblemTypes.Classification);
  });

  it('passes', () => {
    treeview.openFirstRuleSet();
    subTabButtons.goToSubTab(SubTabsNames.RULES_COVERAGE);

    const rowIndices = [1, 2, 3];
    rulesCoverageTable.selectWithCtrlRowsFromRulesCoverageTab(rowIndices);

    cy.wait(2000);
    rulesCoverageTable.rightClickOnCell(2);

    cy.wait(2000);
    rulesCoverageTable.clickOnListItemInRulesCoverageTable();

    rulesCoverageTable.clickRecalculate();

    // Wait for recalculation to complete
    cy.wait(5000);
    
    // Wait for the table to be visible and contain data
    cy.get('[data-cy="example-project-rules-table"]').should('be.visible');
    cy.get('[data-cy="example-project-rules-table"] tbody[role="presentation"]').should('exist');
    
    const exampleTable = new ProjectRulesTable('example-project-rules-table');
    const expectedFirstColumnTexts = ['r4', 'r4', 'r4', 'r4'];
    exampleTable.checkNColumnTextsInTable(0, expectedFirstColumnTexts);
    const expectedThirdColumnTexts = [
      'eggs = {True} AND fins = {True}',
      'eggs = {True} AND fins = {True}',
      'milk = {True}',
      'milk = {True}',
    ];
    exampleTable.checkNColumnTextsInTable(2, expectedThirdColumnTexts);
  });
});
