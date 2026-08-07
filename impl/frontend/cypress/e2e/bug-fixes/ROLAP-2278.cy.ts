
import { filterBuilder } from '@e2e-helpers/devexpress/filterBuilder';
import { projectRulesTable } from '@e2e-helpers/rolap/projectRulesTable/projectRulesTable';
import { rulesEditor } from '@e2e-helpers/rolap/rulesEditor';
import { subTabButtons } from '@e2e-helpers/rolap/subTabButtons';
import { treeview } from '@e2e-helpers/rolap/treeview';
import 'cypress-if';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { SubTabsNames } from '../../../projects/rolap/src/app/common/store/app-state.model';

//TODO: dodawac do tego sprawdzenie metryk w tym tescie
describe('ROLAP-2278 editor test', () => {
  const projectTypes = [ProblemTypes.Classification, ProblemTypes.Regression, ProblemTypes.Survival];

  projectTypes.forEach((projectType) => {
    describe(`Editor should render with all data for ${projectType}`, () => {
      beforeEach(() => {
        cy.prepareTest();
        cy.createSampleProject(projectType);
      });

      it(`After clicking on edit icon in big rules tables for a ${projectType} project editor modal should load data`, () => {
        treeview.openFirstRuleSet();
        subTabButtons.goToSubTab(SubTabsNames.RULES);
        projectRulesTable.clickOnEditButtonInFirstElement(projectType);

        let originalRuleText: string;
        let actualRuleText: string;

        switch (projectType) {
          case ProblemTypes.Classification:
            originalRuleText = 'IF feathers = {True} THEN class = bird';
            actualRuleText = 'IF feathers = {True} THEN class = bird';
            break;
          case ProblemTypes.Regression:

            originalRuleText =
              'IF AGE >= 16.35 AND PTRATIO < 17.50 AND RM >= 7.48 AND LSTAT < 6.25 THEN MEDV = {47.78} [44.45, 51.11]';
            actualRuleText =
              'IF AGE >= 16.35 AND PTRATIO < 17.50 AND RM >= 7.48 AND LSTAT < 6.25 THEN MEDV = {47.78} [44.45, 51.11]';
            break;
          case ProblemTypes.Survival:
            originalRuleText =
              'IF recipient_age < 17.45 AND relapse = {no} AND donor_age < 45.16 THEN survival_status = {672.00}';
            actualRuleText =
              'IF recipient_age < 17.45 AND relapse = {no} AND donor_age < 45.16 THEN survival_status = {672.00}';
            break;
          default:
            throw new Error(`Unknown project type: ${projectType}`);
        }

        rulesEditor.verifyRuleText(actualRuleText);
        rulesEditor.verifyOriginalRuleText(originalRuleText);
        rulesEditor.submitButtonShouldBeVisible();
        rulesEditor.cancelButtonShouldBeVisible();

        cy.get('[data-cy="metric-value-arrow"]').should('not.exist');

        // ROLAP-2278 no undo redo for now (using helper methods for consistency if uncommented)
        // rulesEditor.unodButtonShouldBeDisabled();
        // rulesEditor.redoButtonShouldBeDisabled();
      });

      it('should successfully add a condition to an existing rule and verify modification behavior', () => {
        if (projectType !== ProblemTypes.Regression) {
          cy.log(`Skipping rule modification test for ${projectType}`);
          return;
        }


        const initialRule =
          'IF AGE >= 16.35 AND PTRATIO < 17.50 AND RM >= 7.48 AND LSTAT < 6.25 THEN MEDV = {47.78} [44.45, 51.11]';
        const modifiedRule =
          'IF AGE >= 16.35 AND PTRATIO < 17.50 AND RM >= 7.48 AND LSTAT < 6.25 AND CRIM < 900.00 THEN MEDV = {47.78} [44.45, 51.11]';

        treeview.openFirstRuleSet();
        subTabButtons.goToSubTab(SubTabsNames.RULES);
        projectRulesTable.clickOnEditButtonInFirstElement(projectType);

        cy.get('rolap-project-rules-table-editor').should('be.visible');
        cy.get('[data-cy="actual-rule-text"]').should('contain.text', 'THEN MEDV = {47.78}');

        rulesEditor.verifyRuleText(initialRule);
        rulesEditor.verifyOriginalRuleText(initialRule);
        cy.wait(3000)
        // Add condition using the filterBuilder helper
        filterBuilder.addConditionWithDummyData(projectType);
        cy.wait(1000);
        rulesEditor.verifyRuleText(modifiedRule);
        rulesEditor.verifyOriginalRuleText(initialRule); 
        cy.get('[data-cy="metric-value-arrow"]').should('exist');
        cy.wait(500);
        rulesEditor.submitRule();

      });
    });
  });
});
