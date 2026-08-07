// features/projectRulesTableColumnChooser.ts

// This utility provides methods to interact with the column chooser in the project rules table.
export class ProjectRulesTableColumnChooser {
  private selectors = {
    columnChooserButton: '[data-cy="column-chooser-button"]',
    columnChooserContainer: '[data-cy="column-chooser-container"]',
    columnChooserBackdrop: '[data-cy="column-chooser-backdrop"]',
    columnChooserCloseButton: '[data-cy="column-chooser-close-button"]',
    listItems: '.dx-list-item', // Selector for all list items
    disabledListItems: '.dx-state-disabled', // Selector for disabled list items
    enabledListItems: '.dx-list-item:not(.dx-state-disabled)', // Selector for enabled list items
    dxList: '.dx-list .dx-scrollable-wrapper .dx-scrollable-container', // Selector for dx-list scrollable container
    dxLoader: '.dx-scrollview-scrollbottom-indicator', // Selector for the bottom loader
  };

  /**
   * Clicks the column chooser button.
   */
  public clickColumnChooserButton(): void {
    cy.get(this.selectors.columnChooserButton).click({ force: true });
  }

  /**
   * Scrolls the dx-list to the bottom, ensuring the loader appears and then disappears.
   * Returns a promise when the bottom is reached.
   */
  public scrollToBottom(): Cypress.Chainable {
    const scrollUntilLoaderAppears = (): Cypress.Chainable => {
      return cy
        .get(this.selectors.dxList)
        .scrollTo('bottom', { ensureScrollable: false })
        .then(() => {
          return cy
            .get(this.selectors.dxLoader)
            .should('not.be.visible')
            .then(($loader) => {
              if ($loader.is(':visible')) {
                return scrollUntilLoaderAppears();
              } else {
                // Loader is not visible, resolve the promise
                return cy.wrap(null);
              }
            });
        });
    };

    return cy.get(this.selectors.columnChooserContainer).within(() => {
      return scrollUntilLoaderAppears();
    });
  }

  /**
   * Clicks the close button inside the column chooser.
   */
  public clickColumnChooserCloseButton(): void {
    cy.get(this.selectors.columnChooserCloseButton).click({ force: true });
  }

  /**
   * Clicks the backdrop to close the column chooser.
   */
  public clickColumnChooserBackdrop(): void {
    cy.get(this.selectors.columnChooserBackdrop).click({ force: true });
  }

  /**
   * Asserts that the column chooser is visible.
   */
  public assertColumnChooserVisible(): void {
    cy.get(this.selectors.columnChooserContainer).should('exist');
  }

  /**
   * Asserts that the column chooser is not visible.
   */
  public assertColumnChooserNotVisible(): void {
    cy.get(this.selectors.columnChooserContainer).should('not.exist');
  }

  /**
   * Returns a list of texts for all checkboxes in the dx-list.
   */
  public getAllCheckboxTexts(): Cypress.Chainable<string[]> {
    return cy
      .get(this.selectors.listItems)
      .find('rolap-rules-table-header-text span')
      .then(($els) => Cypress._.map($els, 'innerText'));
  }

  /**
   * Returns a list of texts for disabled checkboxes in the dx-list.
   */
  public getDisabledCheckboxTexts(): Cypress.Chainable<string[]> {
    return cy
      .get(this.selectors.disabledListItems)
      .find('rolap-rules-table-header-text span')
      .then(($els) => Cypress._.map($els, 'innerText'));
  }

  /**
   * Returns a list of texts for enabled checkboxes in the dx-list.
   */
  public getEnabledCheckboxTexts(): Cypress.Chainable<string[]> {
    return cy
      .get(this.selectors.enabledListItems)
      .find('rolap-rules-table-header-text span')
      .then(($els) => Cypress._.map($els, 'innerText'));
  }

  /**
   * Clicks on a rolap-rules-table-header-text span based on its checkbox text.
   */
  public clickCheckboxByText(checkboxText: string): void {
    this.scrollToBottom().then(() => {
      cy.get(this.selectors.listItems).contains('span', checkboxText).click({ force: true });
    });
  }

  /**
   * Clicks all enabled checkboxes in the dx-list.
   */
  public clickAllEnabledCheckboxes(): void {
    this.scrollToBottom().then(() => {
      cy.get(this.selectors.enabledListItems).each(($el) => {
        cy.wrap($el).find('rolap-rules-table-header-text span').click({ force: true });
      });
    });
  }

  /**
   * Returns a list of all enabled and not checked checkboxes in the dx-list.
   */
  public getUncheckedEnabledCheckboxes(): Cypress.Chainable<string[]> {
    return this.scrollToBottom().then(() => {
      return cy
        .get(this.selectors.enabledListItems)
        .filter('[aria-selected="false"]')
        .find('rolap-rules-table-header-text span')
        .then(($els) => Cypress._.map($els, 'innerText'));
    });
  }

  /**
   * Clicks all enabled and unchecked checkboxes in the dx-list.
   */
  public clickAllUncheckedEnabledCheckboxes(): void {
    this.scrollToBottom().then(() => {
      cy.get(this.selectors.enabledListItems)
        .filter('[aria-selected="false"]')
        .each(($el) => {
          cy.wrap($el).find('rolap-rules-table-header-text span').click({ force: true });
        });
    });
  }
}

export const projectRulesTableColumnChooser = new ProjectRulesTableColumnChooser();
