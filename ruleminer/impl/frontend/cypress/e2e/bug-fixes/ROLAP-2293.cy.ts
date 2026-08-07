import { createDevExtremeDataGrid } from '@e2e-helpers/devexpress/DataGrid/dataGird';
import { projectExampleItem } from '@e2e-helpers/rolap/projectExampleItem';
import { treeview } from '@e2e-helpers/rolap/treeview';
import 'cypress-if';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

describe('ROLAP-2293 classify button on dataset should open ruleset', () => {
  Object.values(ProblemTypes).forEach((problemType) => {
    context(`For ${problemType} project`, () => {
      beforeEach(() => {
        cy.prepareTest();
        cy.createSampleProject(problemType);
      });

      it(`Right click row data set table -> classify button should open ruleset | ${problemType} Project`, () => {
        treeview.openFirstDataSet();
        const dataGrid = createDevExtremeDataGrid('rolap-dataset-view');
        dataGrid.loader.assertNoLoader();
        cy.wait(500);
        cy.get('[aria-rowindex="1"] > [aria-describedby="dx-col-2"]').click({ force: true });
        cy.get('[aria-rowindex="1"] > [aria-describedby="dx-col-2"]').rightclick();
        cy.get('.dx-menu-item-text').click({ force: true });
        projectExampleItem.verifyNeedsRecalculationInfoNotVisible();
        if (problemType === ProblemTypes.Classification) {
          projectExampleItem.verifyTableCellValue(0, 1, 'True');
          projectExampleItem.verifyTableCellValue(0, 2, 'False');
        }
        if (problemType === ProblemTypes.Regression) {
          projectExampleItem.verifyTableCellValue(0, 1, '0.00632');
          projectExampleItem.verifyTableCellValue(0, 2, '18');
        }
        if (problemType === ProblemTypes.Survival) {
          projectExampleItem.verifyTableCellValue(0, 1, '22.830137');
          projectExampleItem.verifyTableCellValue(0, 2, 'yes');
        } else {
          projectExampleItem.clickRecalculateButton();
        }
      });
    });
  });
});
