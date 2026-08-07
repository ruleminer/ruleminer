// Helper for <project-rules-table-editor/>
// This utility provides methods to interact with the rules editor in the project.
class RulesEditor {
  private selectors = {
    addNewRuleButton: '[data-cy="rules-add-new"]',
    addManualRuleButton: '[data-cy="add-rule-manual-btn"]',
    actualRuleText: '[data-cy="actual-rule-text"]',
    undoButton: '[data-cy="rule-editor-undo-button"]',
    redoButton: '[data-cy="rule-editor-redo-button"]',
    ruleEditorSubmitButton: '[data-cy="rule-editor-submit-btn"]',
    addRulesToBigTableButton: '[data-cy="add-rules-to-big-table"]',
    originalRuleText: '[data-cy="original-rule-text"]',
    cancelButton: '[data-cy="cancel-button"]',
  };

  /**
   * Adds a new rule.
   */
  public addNewRule(): void {
    cy.get(this.selectors.addNewRuleButton).click({ force: true });
    cy.get(this.selectors.addManualRuleButton).click({ force: true });
    cy.wait(500);
  }

  /**
   * Verifies the rule text.
   * @param expectedText - The expected rule text.
   */
  public verifyRuleText(expectedText: string): void {
    cy.get(this.selectors.actualRuleText).should('be.visible').should('have.text', expectedText);
  }

  /**
   * Undoes the last action.
   */
  public undoLastAction(): void {
    cy.get(this.selectors.undoButton).click({ force: true });
  }

  /**
   * Checks if the undo button is disabled (aria-disabled).
   */
  public unodButtonShouldBeDisabled(): void {
    cy.get(this.selectors.undoButton).should('have.attr', 'aria-disabled', 'true');
  }

  /**
   * Redoes the last action.
   */
  public redoLastAction(): void {
    cy.get(this.selectors.redoButton).click({ force: true });
  }

  /**
   * Checks if the redo button is disabled (aria-disabled).
   */
  public redoButtonShouldBeDisabled(): void {
    cy.get(this.selectors.redoButton).should('have.attr', 'aria-disabled', 'true');
  }

  /**
   * Submits the rule.
   */
  public submitRule(): void {
    cy.get(this.selectors.ruleEditorSubmitButton).click({ force: true });
  }

  /**
   * Checks if the submit button is visible.
   */
  public submitButtonShouldBeVisible(): void {
    cy.get(this.selectors.ruleEditorSubmitButton).should('be.visible').should('not.have.attr', 'aria-disabled', 'true');
  }

  /**
   * Adds rules to the table.
   */
  public addRulesToTable(): void {
    cy.get(this.selectors.addRulesToBigTableButton).click({ force: true });
  }

  /**
   * Verifies the original rule text.
   * @param expectedText - The expected original rule text.
   */
  public verifyOriginalRuleText(expectedText: string): void {
    cy.get(this.selectors.originalRuleText).should('be.visible').should('have.text', expectedText);
  }

  /**
   * Cancel button should exist.
   */
  public cancelButtonShouldBeVisible(): void {
    cy.get(this.selectors.cancelButton).should('be.visible').should('not.have.attr', 'aria-disabled', 'true');
  }
}

export const rulesEditor = new RulesEditor();
