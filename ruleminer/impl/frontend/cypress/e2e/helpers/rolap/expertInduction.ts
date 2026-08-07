// Helper for <rolap-expert-induction />

class ExpertInductionHelper {

  private selectors = {

    container: '[data-cy="expert-induction-container"]',

    title: '[data-cy="expert-induction-title"]',

    tooltip: '[data-cy="expert-induction-tooltip"]',

    switch: '[data-cy="expert-induction-switch"]',

    expandButton: '[data-cy="expert-induction-expand-button"]',

    parametersForm: '[data-cy="expert-induction-parameters-form"]',

    addConditionButton: '[data-cy="expert-condition-button"]',

    addParameterButton: '[data-cy="expert-induction-parameters-form"] dx-button.add-btn'

  };



  /**

   * Toggles the expert induction switch on or off.

   * @param enable - True to turn the switch on, false to turn it off.

   */

  public toggleExpertInduction(enable: boolean): void {

    cy.get(this.selectors.switch).should('be.visible');

    cy.get(this.selectors.switch).find('.dx-switch-handle').invoke('attr', 'aria-checked').then((currentState) => {

      const isCurrentlyEnabled = currentState === 'true';

      if (enable !== isCurrentlyEnabled) {

        cy.get(this.selectors.switch).click({ force: true });

      }

    });

  }



  /**

   * Expands the expert induction section if it's currently collapsed.

   * Requires expert induction to be enabled first.

   */

  public expand(): void {

    cy.get(this.selectors.expandButton).should('be.visible').find('.dx-icon').then($icon => {

      if ($icon.hasClass('dx-icon-spinup')) {

        cy.get(this.selectors.expandButton).click({ force: true });

      }

    });

  }



  /**

   * Collapses the expert induction section if it's currently expanded.

   * Requires expert induction to be enabled first.

   */

  public collapse(): void {

    cy.get(this.selectors.expandButton).should('be.visible').find('.dx-icon').then($icon => {

      if ($icon.hasClass('dx-icon-spindown')) {

        cy.get(this.selectors.expandButton).click({ force: true });

      }

    });

  }



  /**

   * Asserts that the expert induction container is visible.

   */

  public assertVisible(): void {

    cy.get(this.selectors.container).should('be.visible');

  }



  /**

   * Asserts that the expert induction container does not exist or is not visible.

   */

  public assertNotVisible(): void {

    cy.get(this.selectors.container).should('not.exist');

  }



  /**

   * Asserts whether the expert induction section is expanded or collapsed.

   * Requires expert induction to be enabled first.

   * @param expanded - True if the section should be expanded, false otherwise.

   */

  public assertExpanded(expanded: boolean): void {

    const expectedIconClass = expanded ? 'dx-icon-spindown' : 'dx-icon-spinup';

    cy.get(this.selectors.expandButton).find('.dx-icon').should('have.class', expectedIconClass);

  }



  /**

  * Asserts that the parameters form is not visible (or doesn't exist).

  */

  public assertParametersFormNotVisible(): void {

    cy.get(this.selectors.parametersForm).should('not.be.visible');

  }





  public clickAddPreferredCondition(): void {

    cy.get(this.selectors.addParameterButton)
      .eq(2)
      .click({ force: true });

  }

}



export const expertInductionHelper = new ExpertInductionHelper();