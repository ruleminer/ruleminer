//* Helper for Manual-select-rules
// This utility provides methods to interact with the manual-select-rule component.

class ManualSelectRules {
  public selectors = {
    manuallyAlgorithm: '[data-cy="rules-generate-algorithm--Manually"]',
    manualSelectRuleTable: '[data-cy="manual-select-rule-table"]',
  };

  /**
   * Clicks on the manually algorithm button.manualSelectRuleTable
   */
  public clickManuallyAlgorithm(): void {
    cy.get(this.selectors.manuallyAlgorithm).click({ force: true });
  }

  /**
   * Checks the count of rules in manualRulesTable.
   */
  public checkNumberOfRowInManualRulesTable(count: number = 5) {
    cy.get(this.selectors.manualSelectRuleTable)
      .children()
      .find('tbody[role="presentation"]')
      .eq(1)
      .find('tr')
      .should('have.length', count + 1);
  }

  /**
   * Adds manual selected rules.
   */
  public addManualSelectedRules() {
    cy.get('[data-cy="manual-select-rule-accept-button"]').click({ force: true });
  }

  /**
   * Selects a specified number of rows in a manual rules table.
   *
   * @param count The number of rows to select.
   *              Assumes rows are indexed starting from 1.
   */
  public manuallySelectRows(count: number) {
    for (let i = 1; i <= count; i++) {
      cy.get(`[aria-rowindex="${i}"] .dx-command-select .dx-checkbox-icon`).click({ force: true });
    }
  }
}

export const manualSelectRules = new ManualSelectRules();
