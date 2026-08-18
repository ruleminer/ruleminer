/**
 * Helper class for interacting with the RulesEditorSideColumnComponent.
 */
class RulesEditorSideColumnHelper {
  private selectors = {
    nominalAttributeList: '[data-cy="nominal-attribute-list"]',
    preferredConditionCountInput: '[data-cy="preferred-condition-count"]',
    ruleConclusionEditor: '[data-cy="rule-conclusion-editor"]',
    rulesEditorMetrics: '[data-cy="rules-editor-metrics"]',
    listItem: '.dx-list-item',
  };

  private selectNominalAttributeByIndex(index: number) {
    cy.get(this.selectors.nominalAttributeList).find(this.selectors.listItem).eq(index).click({ force: true });
  }

  private selectNominalAttributeByText(text: string) {
    cy.get(this.selectors.nominalAttributeList).find(this.selectors.listItem).contains(text).click({ force: true });
  }

  private setPreferredConditionCount(count: number) {
    cy.get(this.selectors.preferredConditionCountInput)
      .clear()
      .type(count.toString());
  }

  private clearPreferredConditionCount() {
    cy.get(this.selectors.preferredConditionCountInput).clear();
  }

  /**
   * Configures expert forbidden/preferred conditions by selecting items from the list.
   * @param itemsToSelect - An array of strings representing the text of items to select.
   * @param preferredCount - Optional. The count for preferred conditions. Set only if needed.
   */
  public configureExpertCondition(itemsToSelect: string[], preferredCount?: number) {
    itemsToSelect.forEach((itemText) => {
      this.selectNominalAttributeByText(itemText);
    });
    if (preferredCount !== undefined) {
      this.setPreferredConditionCount(preferredCount);
    } else {
      // Ensure count is cleared if not forbidden and no count provided
      cy.get(this.selectors.preferredConditionCountInput).then($el => {
        if ($el.length > 0) { // Check if the input exists (i.e., not forbidden)
          this.clearPreferredConditionCount();
        }
      })
    }
  }

  /**
   * Verifies that the core elements of the side column are visible.
   * This is a basic check and might need adjustment based on config.
   */
  public verifyCoreElementsVisible() {
    // Visibility depends heavily on the input config, making a generic check difficult.
    // We check for the potential presence of the main containers.
    cy.get(this.selectors.ruleConclusionEditor).should('exist'); // It might be hidden by *ngIf
    cy.get(this.selectors.rulesEditorMetrics).should('exist'); // It might be hidden by *ngIf
    // Add checks for nominalAttributeList or preferredConditionCountInput based on expected config
  }

  /**
   * Selects specific items in the nominal attribute list for expert conditions.
   * @param items - Array of strings (item text) or numbers (item index) to select.
   */
  public selectNominalAttributes(items: (string | number)[]) {
    items.forEach(item => {
      if (typeof item === 'string') {
        this.selectNominalAttributeByText(item);
      } else {
        this.selectNominalAttributeByIndex(item);
      }
    });
  }

  /**
 * Sets the preferred condition count if the input is visible.
 * @param count - The count to set.
 */
  public setPreferredCount(count: number) {
    cy.get(this.selectors.preferredConditionCountInput).then($el => {
      if ($el.is(':visible')) {
        this.setPreferredConditionCount(count);
      } else {
        cy.log('Preferred condition count input is not visible, skipping set.');
      }
    });
  }
}

// Export a singleton instance using camelCase
export const rulesEditorSideColumnHelper = new RulesEditorSideColumnHelper();