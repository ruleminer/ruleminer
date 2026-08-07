// Helper for <dataset-view />
// This utility provides methods to interact with the DatasetViewComponent.
class DatasetView {
  private selectors = {
    summaryItem: '[data-cy="summary-item"]',
    summaryKey: '[data-cy="summary-key"]',
    summaryValue: '[data-cy="summary-value"]',
    filteredCountContainer: '[data-cy="filtered-count-container"]',
    filteredCountLabel: '[data-cy="filtered-count-label"]',
    filteredCountValue: '[data-cy="filtered-count-value"]',
  };

  // Verify the summary items are displayed correctly
  public verifySummaryItems(): void {
    cy.get(this.selectors.summaryItem).each(($el) => {
      cy.wrap($el).find(this.selectors.summaryKey).should('exist');
      cy.wrap($el).find(this.selectors.summaryValue).should('exist');
    });
  }

  // Verify the filtered count is displayed correctly
  public verifyFilteredCount(): void {
    cy.get(this.selectors.filteredCountContainer).should('exist');
    cy.get(this.selectors.filteredCountLabel).should(
      'contain.text',
      'dataset.statistic_tab.summary_number_of_filtered_count',
    );
    cy.get(this.selectors.filteredCountValue).should('exist');
  }

  // Check if a summary item contains specific text
  public checkSummaryItem(index: number, keyText: string, valueText: string): void {
    const timeout = 5000;
    cy.get(this.selectors.summaryItem, { timeout })
      .eq(index)
      .within(() => {
        cy.get(this.selectors.summaryKey, { timeout }).should('contain.text', keyText);
        cy.get(this.selectors.summaryValue, { timeout }).should('contain.text', valueText);
      });
  }

  // Check if the filtered count contains specific text
  public checkFilteredCount(labelText: string, valueText: string): void {
    cy.get(this.selectors.filteredCountContainer).within(() => {
      cy.get(this.selectors.filteredCountLabel).should('contain.text', labelText);
      cy.get(this.selectors.filteredCountValue).should('contain.text', valueText);
    });
  }
}

export const datasetView = new DatasetView();
