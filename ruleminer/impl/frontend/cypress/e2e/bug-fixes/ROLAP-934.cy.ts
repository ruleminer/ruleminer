import { SubTabsNames } from "../../../projects/rolap/src/app/common/store/app-state.model";
import { ProblemTypes } from "../../../projects/rolap/src/app/main/data-upload/utils/enums";
import { createDevExtremeDataGrid } from "../helpers/devexpress/DataGrid/dataGird";
import { SortingDirection } from "../helpers/devexpress/DataGrid/features/tableSorting";
import { datasetView } from "../helpers/rolap/datasetView";
import { subTabButtons } from "../helpers/rolap/subTabButtons";
import { treeview } from "../helpers/rolap/treeview";


describe('Test ROLAP-934', () => {
    beforeEach(() => {
        cy.prepareTest();
        cy.createSampleProject(ProblemTypes.Classification);
        cy.intercept('POST', '**/api/datasets/*/preview?limit=20&offset=0').as('postDatasetPreview');
    });

    it.only('Should save sort state of the DatasetViewTable in localstorage', () => {
        const dataGrid = createDevExtremeDataGrid('rolap-dataset-view');
        treeview.openFirstDataSet();
        datasetView.checkSummaryItem(0, 'Liczba kolumn: ', '17');
        datasetView.checkSummaryItem(1, 'Liczba wierszy: ', '101');
        datasetView.checkFilteredCount('Liczba wierszy spełniających kryteria filtracji: ', '');

        cy.wait(5000);
        dataGrid.sorting.sortColumn('hair', SortingDirection.ASCENDING);
        cy.wait('@postDatasetPreview');
        dataGrid.assertExist();
        dataGrid.loader.assertNoLoader();
        cy.wait(9000); //wait for saving table state (devextreme method)
        dataGrid.sorting.assertColumnSorted('hair', SortingDirection.ASCENDING);
        subTabButtons.goToSubTab(SubTabsNames.STATISTICS);
        cy.wait(5000);
        subTabButtons.goToSubTab(SubTabsNames.DATASET);
        cy.wait('@postDatasetPreview');
        dataGrid.assertExist();
        dataGrid.loader.assertNoLoader();

        dataGrid.sorting.assertColumnSorted('hair', SortingDirection.ASCENDING);

    });

});
