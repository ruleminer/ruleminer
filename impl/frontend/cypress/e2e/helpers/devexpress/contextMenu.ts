/**
 * Clicks on a list item within a DevExtreme context menu overlay by its index.
 * Handles cases where multiple overlays might be present in the DOM.
 *
 * @param menuSelector - The Cypress selector string for the context menu trigger element.
 * @param index - The zero-based index of the list item to click.
 */
export function clickListItemByIndex(menuSelector: string, index: number): void {
  cy.log(`clickListItemByIndex: Attempting to interact with menu '${menuSelector}'`);
  
  cy.get(menuSelector).should('exist');
  
  cy.log(`Looking for visible DevExtreme overlay menu items...`);
  
  cy.get('.dx-overlay-content')
    .filter(':visible')
    .last()
    .within(() => {
      cy.get('[role="menuitem"]')
        .should('be.visible')
        .should('have.length.gt', index)
        .eq(index)
        .click({ force: true });
    });
}