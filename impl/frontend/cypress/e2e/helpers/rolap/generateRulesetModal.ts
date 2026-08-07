class GenerateRulesetModal {
  selectors = {
    generateButton: '[data-cy="generate-button"]',
  };

  /**
   * Click on generate ruleset button.
   */
  public generateNewRuleset() {
    cy.get(this.selectors.generateButton).should('be.visible').click({ force: true });
  }
}

export const generateRulesetModal = new GenerateRulesetModal();
