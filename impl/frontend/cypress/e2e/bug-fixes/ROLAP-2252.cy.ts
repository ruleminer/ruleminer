import 'cypress-if';
import { subTabButtons } from '@e2e-helpers/rolap/subTabButtons';
import { SubTabsNames } from 'projects/rolap/src/app/common/store/app-state.model';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { projectRulesTable } from '@e2e-helpers/rolap/projectRulesTable/projectRulesTable';
import { refreshAllBtnHelper } from '@e2e-helpers/rolap/refresh/refreshAllBtn';
import { treeview } from '@e2e-helpers/rolap/treeview';

describe('ROLAP-2252 Test Conclusion column and conclusion refresh', () => {
  // --- Test 1: Only for Classification ---
  describe('Classification Project tests', () => {
    beforeEach(() => {
      cy.prepareTest();
      cy.createSampleProject(ProblemTypes.Classification);
    });

    it('Verify That Filtering the Conclusion Column by a Specific Keyword Persists After Navigation in a Classification Project', () => {
      treeview.openFirstRuleSet();
      subTabButtons.goToSubTab(SubTabsNames.RULES);

      // Wait for the table to be fully loaded and ready
      cy.get('[data-cy="rules-big-table"]').should('be.visible');
      cy.wait(1000); // Allow time for table initialization

      // Use helper function to filter the "Conclusion" column by 'bird'
      projectRulesTable.filterColumn('Conclusion', 'bird');

      // Define the expected texts after filtering
      const expectedRuleConclusionTexts = ['bird'];
      projectRulesTable.checkNColumnTextsInTable(5, expectedRuleConclusionTexts);

      // Navigate away from the rules tab and return to it
      subTabButtons.goToSubTab(SubTabsNames.DESCRIPTION);
      cy.wait(500);
      subTabButtons.goToSubTab(SubTabsNames.RULES);
      
      // Wait for the table to reload after navigation
      cy.wait(1000);

      // Verify that the filtered column texts persist after navigation
      projectRulesTable.checkNColumnTextsInTable(5, expectedRuleConclusionTexts);
    });
  });

  // --- Test 2: Run for Every Project Type ---
  //TODO: add survival
  const projectTypes = [ProblemTypes.Classification, ProblemTypes.Regression];

  projectTypes.forEach((projectType) => {
    describe(`Refresh all button tests for ${projectType} Project`, () => {
      beforeEach(() => {
        cy.prepareTest();
        cy.createSampleProject(projectType);
      });

      it(`Clicking on refresh all should refresh data in a ${projectType} Project`, () => {
        treeview.openFirstRuleSet();
        subTabButtons.goToSubTab(SubTabsNames.RULES);

        // Initially, assert the refresh button state (e.g. ready to refresh)
        refreshAllBtnHelper.assertButtonState(
          true, // shouldBeVisible
          'orange', // expectedColor for the initial state
          'Odśwież wszystkie dane', // expected button text
        );

        projectRulesTable.deleteFirstRule();

        refreshAllBtnHelper.clickRefreshButton();

        cy.wait(6000);
        refreshAllBtnHelper.assertButtonState(false);
      });
    });
  });
});
