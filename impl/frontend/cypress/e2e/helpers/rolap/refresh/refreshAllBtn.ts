export class RefreshAllBtnHelper {
  private selectors = {
    refreshButton: '[data-cy="refresh-all-button"]',
    refreshIcon: '[data-cy="refresh-all-button-icon"]',
  };

  /**
   * Click the refresh button if it's visible
   */
  clickRefreshButton(): void {
    cy.get(this.selectors.refreshButton).should('exist').click({ force: true });
  }

  /**
   * Assert the refresh button is in the specified state
   * @param shouldBeVisible - Whether the button should be visible
   * @param expectedColor - Expected CSS color class
   * @param expectedSpin - Whether the icon should be spinning
   * @param expectedText - Expected button text
   */
  assertButtonState(shouldBeVisible: boolean, expectedColor?: string, expectedText?: string): void {
    const assertion = shouldBeVisible ? 'exist' : 'not.exist';

    cy.get(this.selectors.refreshButton)
      .should(assertion)
      .then(($button) => {
        if (!shouldBeVisible) return;

        if (expectedColor) {
          expect($button).to.have.class(expectedColor);
        }

        if (expectedText) {
          expect($button.text().trim()).to.include(expectedText);
        }
      });
  }
}

export const refreshAllBtnHelper = new RefreshAllBtnHelper();
