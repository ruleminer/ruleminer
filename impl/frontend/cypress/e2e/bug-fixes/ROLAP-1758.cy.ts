import 'cypress-if';
import { treeview } from '@e2e-helpers/rolap/treeview';

import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums';
import { createDevExtremeDataGrid } from '@e2e-helpers/devexpress/DataGrid/dataGird';
import { SortingDirection } from '@e2e-helpers/devexpress/DataGrid/features/tableSorting';

describe('Test ROLAP-1758', () => {
  beforeEach(() => {
    cy.prepareTest();
    cy.createSampleProject(ProblemTypes.Regression);
  });

  it('Should sort conclusion column correctly. After refreshing the page, the order of the rules should be the same', () => {
    treeview.openFirstRuleSet();
    cy.wait(2000); // wait until data is loaded to rules table

    const dataGrid = createDevExtremeDataGrid('[data-cy="rules-big-table"]');
    dataGrid.sorting.sortColumn('Display Conclusion', SortingDirection.ASCENDING); // In regression Conclusion column has data from Train Covered YMean
    cy.wait(500); // wait until the column is sorted
    const indexesBeforeRefresh = dataGrid.sorting.getVisibleRowIndexes();
    cy.reload(); // before bug fix, after app reload, row order are not the same
    cy.wait(8000); // wait until data is loaded to rules table. Time is longer than before because the application is reloading
    const indexesAfterRefresh = dataGrid.sorting.getVisibleRowIndexes();

    // Compare whether the visible indexes from the table after sorting are the same before and after reloading the application.
    Promise.all([indexesBeforeRefresh, indexesAfterRefresh]).then((result) => {
      const beforeString = result[0].toString();
      const afterString = result[1].toString();
      expect(beforeString).eq(afterString);
    });
  });
});
