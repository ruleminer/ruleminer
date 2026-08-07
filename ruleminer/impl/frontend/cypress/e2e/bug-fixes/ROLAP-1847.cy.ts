import 'cypress-if';
import { subTabButtons } from '@e2e-helpers/rolap/subTabButtons';
import { SubTabsNames } from 'projects/rolap/src/app/common/store/app-state.model';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { treeview } from '@e2e-helpers/rolap/treeview';

describe('Test ROLAP-1847', () => {
  Object.values(ProblemTypes).forEach((problemType) => {
    context(`For ${problemType} project`, () => {
      beforeEach(() => {
        cy.prepareTest();
        cy.createSampleProject(problemType);
      });

      it('Rule name column should be visible in rules coverage subtab.', () => {
        treeview.openFirstRuleSet();
        subTabButtons.goToSubTab(SubTabsNames.RULES_COVERAGE);
        cy.get('[data-cy="rule-name-cell"]').should('be.visible');
      });
    });
  });
});
