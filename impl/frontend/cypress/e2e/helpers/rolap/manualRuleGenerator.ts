/**
 * Represents a manual rule generator component.
 */
class ManualRuleGenerator {
  private selectors = {
    anotherRulesButton: '[data-cy="add-rule-from-another-ruleset-btn"]',
  };

  /**
   * Clicks the "Another Rules" button.
   */
  public clickAnotherRulesButton(): void {
    cy.get(this.selectors.anotherRulesButton).click({ force: true });
  }
}

export const manualRuleGenerator = new ManualRuleGenerator();
