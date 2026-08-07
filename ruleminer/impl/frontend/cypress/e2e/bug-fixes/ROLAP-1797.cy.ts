import 'cypress-if';

import { SubTabsNames } from '../../../projects/rolap/src/app/common/store/app-state.model';
import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums';
import { createDevExtremeDataGrid } from '@e2e-helpers/devexpress/DataGrid/dataGird';
import { projectRulesTable } from '@e2e-helpers/rolap/projectRulesTable/projectRulesTable';
import { subTabButtons } from '@e2e-helpers/rolap/subTabButtons';
import { treeview } from '@e2e-helpers/rolap/treeview';

describe('Test ROLAP-1797', () => {
  beforeEach(() => {
    cy.prepareTest();
    cy.createSampleProject(ProblemTypes.Classification);
  });

  it.only('Should not display devExtreme table loader on rule comparison view when user selects diferent row to compare (clicks on rules-table-comparison-cell component)', () => {
    const dataGrid = createDevExtremeDataGrid('rolap-project-rules-table');

    treeview.openFirstRuleSet();
    subTabButtons.goToSubTab(SubTabsNames.RULE_COMPARISON);

    projectRulesTable.clickComparisonCheckbox(2);
    dataGrid.loader.assertNoLoader();
    projectRulesTable.clickComparisonCheckbox(3);
    dataGrid.loader.assertNoLoader();
    projectRulesTable.clickComparisonCheckbox(4);
    dataGrid.loader.assertNoLoader();
    projectRulesTable.clickComparisonCheckbox(1);
    dataGrid.loader.assertNoLoader();
  });
});
