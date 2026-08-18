import 'cypress-if';
import { projectRulesCoverageTable } from '@e2e-helpers/rolap/projectRulesCoverageTable';
import { projectRulesTable } from '@e2e-helpers/rolap/projectRulesTable/projectRulesTable';
import { subTabButtons } from '@e2e-helpers/rolap/subTabButtons';
import { SubTabsNames } from 'projects/rolap/src/app/common/store/app-state.model';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { treeview } from '@e2e-helpers/rolap/treeview';

describe('Test ROLAP-1800', () => {
  beforeEach(() => {
    cy.prepareTest();
    cy.createSampleProject(ProblemTypes.Classification);
  });

  it.only(`Filtering rules names displayed in chips below the coverage table should be displayed 
    in ascending order, no matter the order in which they are selected`, () => {
    const rulesIndicesToSelect = [3, 2, 10, 1];

    treeview.openFirstRuleSet();
    subTabButtons.goToSubTab(SubTabsNames.RULES_COVERAGE);

    rulesIndicesToSelect.forEach((ruleIndex) => {
      projectRulesTable.toggleFilterTheDatasetColumnForRule(ruleIndex);
    });

    projectRulesCoverageTable.getDisplayedFilteringRulesIndices().then((displayedFilteringRulesIndices) => {
      expect(displayedFilteringRulesIndices).to.deep.eq(rulesIndicesToSelect.sort((a, b) => a - b));
    });
  });
});
