// This utility provides methods to interact with a table component and check its loading state.
export class TableLoader {
  private tableSelector: string;
  private selectors = {
    loader: () => `${this.tableSelector} .dx-loadpanel-content`,
    loaderInvisibleClass: 'dx-state-invisible',
  };

  constructor(tableSelector: string) {
    this.tableSelector = tableSelector;
  }

  // Assert that the loader does not exist inside the table component within the specified timeout
  public assertNoLoader(timeout: number = 5000): void {
    cy.get(this.selectors.loader(), { timeout }).should('have.class', this.selectors.loaderInvisibleClass);
  }
}
