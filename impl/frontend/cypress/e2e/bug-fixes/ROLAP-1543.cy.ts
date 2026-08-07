import 'cypress-if';
import { projectRulesTable } from '@e2e-helpers/rolap/projectRulesTable/projectRulesTable';
import { subTabButtons } from '@e2e-helpers/rolap/subTabButtons';
import { SubTabsNames } from 'projects/rolap/src/app/common/store/app-state.model';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { treeview } from '@e2e-helpers/rolap/treeview';

describe('Test ROLAP-1543', () => {
  //TODO: fix reggression
  Object.values([ProblemTypes.Classification]).forEach((projectType) => {
    context(`For ${projectType} project`, () => {
      const rulesIndicesToSelect = [0];

      beforeEach(() => {
        cy.prepareTest();
        cy.createSampleProject(projectType);
      });

      it('Removing rules from the ruleset should also remove them from the coverage table filtering and visible rules.', () => {
        treeview.openFirstRuleSet();
        subTabButtons.goToSubTab(SubTabsNames.RULES_COVERAGE);

        rulesIndicesToSelect.forEach((ruleIndex) => {
          projectRulesTable.toggleFilterTheDatasetColumnForRule(ruleIndex);
        });

        projectRulesTable.deleteFirstRule();

        cy.get('[data-cy="rules-coverage-filter-header"] [data-cy="clear-btn"]').should('not.exist');
        cy.get('[data-cy="rules-coverage-visibility-header"] [data-cy="clear-btn"]').should('not.exist');
      });
    });
  });
});
