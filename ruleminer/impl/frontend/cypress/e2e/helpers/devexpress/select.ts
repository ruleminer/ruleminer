function fillSelect(
  selector: string,
  optionSelectFunction: (options: Cypress.Chainable<JQuery<HTMLElement>>) => Cypress.Chainable<JQuery<HTMLElement>>,
) {
  cy.get(selector)
    .should('be.visible')
    .click({ force: true })
    .then(($input) => {
      const ariaOwns = $input.attr('aria-owns') || $input.attr('aria-describedby');

      if (ariaOwns) {
        const selectOptions = cy.get(`#${ariaOwns}`).find('[role="option"]');
        optionSelectFunction(selectOptions).click({ force: true });
      } else {
        cy.get('.dx-overlay-content:visible')
          .last()
          .within(() => {
            const selectOptions = cy.get('[role="option"]');
            optionSelectFunction(selectOptions).click({ force: true });
          });
      }

      cy.wait(200);
      cy.get('body').click({ force: true });
    });
}

/**
 * Fill devexpress select by selection option containing given text
 *
 * @param selector select element selector
 * @param optionText option text
 */
export function fillSelectByOptionText(selector: string, optionText: string) {
  fillSelect(selector, (options) => {
    return options.contains(optionText);
  });
}

/**
 * Fill devexpress select by selection option with given index
 *
 * @param selector select element selector
 * @param index option index
 */
export function fillSelectByOptionIndex(selector: string, index: number) {
  fillSelect(selector, (options) => {
    return options.should('have.length.gt', index).eq(index);
  });
}