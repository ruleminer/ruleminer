/**
 * Helper for <project-rules-prediction-indicators-card />
 * This utility provides methods to interact with the ProjectRulesPredictionIndicatorsCardComponent.
 */
class ProjectRulesPredictionIndicatorsCard {
  private selectors = {
    dataSetName: '[data-cy="rules-prediction-indicators-card-data-set-name"]',
    useDefaultRuleCheckbox: '[data-cy="use-default-rule-checkbox"]',
  };

  /**
   * Checks the contents of the span element for the data set name.
   *
   * @param expectedText - The expected text content of the span element.
   */
  public checkDataSetName(expectedText: string): void {
    cy.get(this.selectors.dataSetName).should('have.text', expectedText);
  }

  public clickUseDefaultRuleCheckbox(): void {
    cy.get(this.selectors.useDefaultRuleCheckbox).click({ force: true });
  }
}

export const projectRulesPredictionIndicatorsCard = new ProjectRulesPredictionIndicatorsCard();
