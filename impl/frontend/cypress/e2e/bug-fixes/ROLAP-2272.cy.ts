import 'cypress-if';
import { subTabButtons } from '@e2e-helpers/rolap/subTabButtons';
import { SubTabsNames } from 'projects/rolap/src/app/common/store/app-state.model';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { projectRulesPredictionIndicatorsCard } from '@e2e-helpers/rolap/projectRulesPredictionIndicatorsCard';
import { refreshAllBtnHelper } from '@e2e-helpers/rolap/refresh/refreshAllBtn';
import { treeview } from '@e2e-helpers/rolap/treeview';

describe('ROLAP-2272 Test Prediction refresh all button', () => {
  //TODO: add survival
  const projectTypes = [ProblemTypes.Classification, ProblemTypes.Regression];

  projectTypes.forEach((projectType) => {
    describe(`Refresh all button tests for ${projectType} Project`, () => {
      beforeEach(() => {
        cy.prepareTest();
        cy.createSampleProject(projectType);
        cy.intercept('PUT', '**/calculate/*/prediction_indicators').as('putPredictionIndicators');
        cy.intercept('PUT', '**/calculate/*/rules_coverage').as('putRulesCoverage');
      });

      it(`Clicking on refresh all should refresh data in a ${projectType} Project`, () => {
        treeview.openFirstRuleSet();
        refreshAllBtnHelper.assertButtonState(
          true,
          'orange',
          'Odśwież wszystkie dane',
        );
        subTabButtons.goToSubTab(SubTabsNames.PREDICTION_STATISTICS);
        cy.wait(9000)

        projectRulesPredictionIndicatorsCard.clickUseDefaultRuleCheckbox();
        subTabButtons.goToSubTab(SubTabsNames.RULES);
        cy.wait(3000);
      

        refreshAllBtnHelper.clickRefreshButton();

        cy.wait('@putPredictionIndicators').its('response.statusCode').should('eq', 200);
        cy.wait('@putRulesCoverage').its('response.statusCode').should('eq', 200);
        cy.wait(6000)
        refreshAllBtnHelper.assertButtonState(false);
      });
    });
  });
});