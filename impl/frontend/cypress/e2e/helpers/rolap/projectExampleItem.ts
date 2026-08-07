//* Helper for <rolap-project-example-item />
// This utility provides methods to interact with the example item component and its children.
class ProjectExampleItem {
  public selectors = {
    recalculateButton: '[data-cy="example-recalculate-button"]',
    needsRecalculationInfo: '[data-cy="example-needs-recalculation-info"]',
    rulesTable: '[data-cy="example-project-rules-table"]',
    dataGrid: '[data-cy="example-data-grid-0"]',
  };

  // Click the recalculate button
  public clickRecalculateButton(): void {
    cy.get(this.selectors.recalculateButton)
      .should('be.visible')
      .should('not.be.disabled')
      .then(($button) => {
        cy.wrap($button).click({ multiple: true });
        // Wait for the rules table to appear after recalculation, with extended timeout
        cy.get(this.selectors.rulesTable, { timeout: 60000 }).should('exist');
      });
  }

  // Verify the needs recalculation info is visible
  public verifyNeedsRecalculationInfoVisible(): void {
    cy.get(this.selectors.needsRecalculationInfo, { timeout: 10000 }).should('be.visible');
  }

  // Verify the needs recalculation info is not visible
  public verifyNeedsRecalculationInfoNotVisible(): void {
    cy.get(this.selectors.needsRecalculationInfo, { timeout: 10000 }).should('not.exist');
  }

  // Verify the value in the specified cell of the data grid
  public verifyTableCellValue(rowIndex: number, columnIndex: number, expectedValue: string): void {
    cy.get(
      `${this.selectors.dataGrid} .dx-data-row[aria-rowindex="${rowIndex + 1}"] td[aria-colindex="${columnIndex + 1}"]`,
    )
      .should('be.visible')
      .should('contain.text', expectedValue);
  }
}

export const projectExampleItem = new ProjectExampleItem();
