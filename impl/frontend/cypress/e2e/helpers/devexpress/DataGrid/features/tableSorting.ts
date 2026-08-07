// This utility provides methods to interact with a table component and manage sorting.
export class TableSorting {
  private tableSelector: string;

  constructor(tableSelector: string) {
    this.tableSelector = tableSelector;
  }

  private columnHeaderGetter = (columnName: string) =>
    cy
      .get(this.tableSelector)
      .should('exist')
      .find('tbody[role="presentation"]')
      .eq(0)
      .find(`td[aria-label="Column ${this.capitalizeFirstLetter(columnName)}"]`);

  /**
   * Set column sorting.
   *
   * @param columnName
   * @param sortingDirection
   */
  public sortColumn(columnName: string, sortingDirection: SortingDirection) {
    this.columnHeaderGetter(columnName)
      .invoke('attr', 'aria-sort')
      .then((sortValue) => {
        if (sortingDirection === SortingDirection.NONE) {
          this.clearSorting(columnName);
          return;
        }

        if (sortValue !== sortingDirection) {
          this.columnHeaderGetter(columnName).click({ force: true });
          cy.wait(2000); // Add a small wait to let the DOM update.
          this.columnHeaderGetter(columnName).invoke('attr', 'aria-sort').should('eq', sortingDirection);
        }
      });
  }

  /**
   * Remove sorting from column.
   *
   * @param columnName
   */
  public clearSorting(columnName: string) {
    this.columnHeaderGetter(columnName).click({
      ctrlKey: true,
      force: true,
    });
  }

  /**
   * Assert column sorting.
   *
   * @param columnName
   * @param expectedDirection
   */
  public assertColumnSorted(columnName: string, expectedDirection: SortingDirection) {
    this.columnHeaderGetter(columnName).invoke('attr', 'aria-sort').should('eq', expectedDirection);
  }

  private capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * Get value from '#' column.
   */
  public getVisibleRowIndexes(): Promise<string[]> {
    const indexes: string[] = [];

    return new Promise((resolve) => {
      cy.get('[data-cy="rules-big-table"]')
        .find('tbody[role="presentation"]')
        .eq(1)
        .find('tr.dx-data-row')
        .each(($row) => {
          cy.wrap($row)
            .find('td')
            .eq(0)
            .find('span')
            .invoke('text')
            .then(($innerText) => indexes.push($innerText.trim()));
        })
        .then(() => resolve(indexes));
    });
  }
}

export enum SortingDirection {
  NONE = 'none',
  DESCENDING = 'descending',
  ASCENDING = 'ascending',
}
