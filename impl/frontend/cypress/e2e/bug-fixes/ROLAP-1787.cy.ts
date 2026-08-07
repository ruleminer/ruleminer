import 'cypress-if';
import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums';
import { clickListItemByIndex } from '../helpers/devexpress/contextMenu';
import { filterBuilder } from '../helpers/devexpress/filterBuilder';
import { rulesEditor } from '../helpers/rolap/rulesEditor';
import { treeview } from '../helpers/rolap/treeview';
import { generateRulesetModal } from '../helpers/rolap/generateRulesetModal';

describe('Test ROLAP-1787', () => {
  Object.values(ProblemTypes).forEach((problemType) => {
    context(`For ${problemType} projects`, () => {
      beforeEach(() => {
        cy.prepareTest();
        cy.createSampleProject(problemType);
        cy.intercept('POST', '**/api/datasets/*/condition_coverage').as('conditionCoverage');
        cy.intercept('PUT', '**/calculate/*/rule_indicators').as('putRuleIndicators');
      });

      it('Should be able to add rules when manually creating ruleset', () => {
        treeview.rightClickOnFirstDataSet();
        clickListItemByIndex('[data-cy="context-menu"]', 0);

        cy.get('[data-cy="rules-generate-algorithm--Manually"]').click();
        cy.get('[data-cy="add-rule-manual-btn"]').click();

        cy.wait(2000);

        filterBuilder.addConditionWithDummyData(problemType);

        cy.wait('@conditionCoverage').its('response.statusCode').should('eq', 200);
        cy.wait('@putRuleIndicators').its('response.statusCode').should('be.oneOf', [200, 204]);

        rulesEditor.submitButtonShouldBeVisible();
        rulesEditor.submitRule();


        generateRulesetModal.generateNewRuleset();
      });
    });
  });
});