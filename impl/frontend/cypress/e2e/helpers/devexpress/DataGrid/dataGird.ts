import { TableHeaders } from './features/tableHeaders';
import { TableLoader } from './features/tableLoader';
import { TableSorting } from './features/tableSorting';

// This utility provides methods to interact with a DevExtreme DataGrid component
class DevExtremeDataGrid {
  public sorting: TableSorting;
  public loader: TableLoader;
  public headers: TableHeaders;
  private tableSelector: string;

  constructor(tableSelector: string) {
    this.tableSelector = tableSelector; // Selector for the table component
    this.sorting = new TableSorting(tableSelector);
    this.loader = new TableLoader(tableSelector);
    this.headers = new TableHeaders(tableSelector);
  }

  public assertExist(): void {
    cy.get(this.tableSelector).should('exist');
  }
}

export const createDevExtremeDataGrid = (tableSelector: string) => new DevExtremeDataGrid(tableSelector);
