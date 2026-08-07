// features/TableHeaders.ts

// This utility provides methods to interact with a table component and check its loading state and headers.
export class TableHeaders {
  private tableSelector: string;
  private selectors = {
    loader: () => `${this.tableSelector} .dx-loadpanel-content`,
    visibleHeaders: () => `${this.tableSelector} .dx-datagrid-headers .dx-header-row > td`,
    headerText: 'rolap-rules-table-header-text span',
    scrollContainer: () => `${this.tableSelector} .dx-scrollable-wrapper .dx-scrollable-container`,
  };

  constructor(tableSelector: string) {
    this.tableSelector = tableSelector;
  }

  /**
   * Get all visible headers in the table component.
   */
  public getAllVisibleHeaders(): Cypress.Chainable<string[]> {
    const headers: string[] = [];

    const collectHeaders = () => {
      return cy.get(this.selectors.visibleHeaders()).then(($els) => {
        const texts = Cypress._.map($els.find(this.selectors.headerText), 'innerText');
        texts.forEach((text) => {
          if (!headers.includes(text)) headers.push(text);
        });
      });
    };

    const scrollAndCollect = (scrollLeft = 0): Cypress.Chainable<string[]> => {
      return cy
        .get(this.selectors.scrollContainer())
        .scrollTo('right')
        .then(() => {
          return collectHeaders().then(() => {
            return cy
              .get(this.selectors.scrollContainer())
              .invoke('scrollLeft')
              .then((currentScrollLeft) => {
                if (currentScrollLeft !== undefined && currentScrollLeft > scrollLeft) {
                  return scrollAndCollect(currentScrollLeft);
                } else {
                  return headers;
                }
              });
          });
        });
    };

    return scrollAndCollect().then(() => headers);
  }
}
