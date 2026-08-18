class RulesCoverageTable {
  private selectors = {
    table: '[data-cy="project-rules-coverage-table"]',
    tbody: 'tbody[role="presentation"]',
    recalculateButton: '[data-cy="example-recalculate-button"]',
  };

  /**
   * Selects rows from the rules coverage table using the Ctrl key.
   * @param rowIndices - An array of row indices to select.
   */
  public selectWithCtrlRowsFromRulesCoverageTab(rowIndices: number[]): void {
    cy.get(this.selectors.table).should('be.visible');

    rowIndices.forEach((index) => {
      cy.get(this.selectors.table).find(this.selectors.tbody).eq(2).find(`tr[aria-rowindex="${index}"]`).click({
        ctrlKey: true,
        force: true,
      });
    });
  }

  /**
   * Performs a right-click action on a specific cell in the project rules coverage table.
   */
  public rightClickOnCell(index: number): void {
    cy.get('[data-cy="project-rules-coverage-table"]')
      .should('exist')
      .find('tbody[role="presentation"]')
      .eq(index)
      .find(`td[aria-colindex="${index}"]`)
      .eq(index)
      .rightclick({ force: true });
  }

  /**
   * Clicks on a list item in the rules coverage table.
   */
  public clickOnListItemInRulesCoverageTable(): void {
    cy.get('.dx-overlay-content.dx-inner-overlay.dx-context-menu.dx-datagrid.dx-menu-base')
      .find('.dx-submenu')
      .find('.dx-menu-items-container.dx-menu-no-icons')
      .find('.dx-menu-item-wrapper')
      .find('.dx-item.dx-menu-item.dx-menu-item-has-text')
      .find('.dx-item-content.dx-menu-item-content')
      .click({ force: true });
  }

  /**
   * Clicks the "Recalculate" button in examples view.
   */
  public clickRecalculate(): void {
    cy.get(this.selectors.recalculateButton).click();
  }
}

export const rulesCoverageTable = new RulesCoverageTable();
