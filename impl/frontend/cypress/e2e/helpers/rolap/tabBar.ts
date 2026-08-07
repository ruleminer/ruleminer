class TabBar {
  private selectors = {
    componentSelector: 'rolap-tab-bar',
    tabItem: 'rolap-tab-bar-item',
    tabLink: 'a',
    activeTabLink: 'a.active',
    closeButtonIcon: 'fa-icon[data-icon="xmark"]',
  };

  public assertVisible(): void {
    cy.get(this.selectors.componentSelector).should('be.visible');
  }

  public getActiveTabText(): Cypress.Chainable<string> {
    return cy.get(this.selectors.componentSelector)
      .find(this.selectors.activeTabLink)
      .invoke('text')
      .then(text => text.trim());
  }

  public assertActiveTabText(expectedText: string): void {
    this.getActiveTabText().should('eq', expectedText);
  }

  public clickTabByText(tabText: string): void {
    cy.get(this.selectors.componentSelector)
      .contains(this.selectors.tabLink, tabText)
      .should('be.visible')
      .click({ force: true });
  }

  public closeTabByText(tabText: string): void {
    cy.get(this.selectors.componentSelector)
      .contains(this.selectors.tabLink, tabText)
      .closest(this.selectors.tabItem)
      .find(this.selectors.closeButtonIcon)
      .should('be.visible')
      .click({ force: true });
  }

  public assertTabIsActive(tabText: string): void {
    cy.get(this.selectors.componentSelector)
      .contains(this.selectors.tabLink, tabText)
      .should('have.class', 'active');
  }

  public assertTabIsNotActive(tabText: string): void {
    cy.get(this.selectors.componentSelector)
      .contains(this.selectors.tabLink, tabText)
      .should('not.have.class', 'active');
  }

  public assertTabExists(tabText: string): void {
    cy.get(this.selectors.componentSelector)
      .contains(this.selectors.tabLink, tabText)
      .should('exist');
  }

  public assertTabDoesNotExist(tabText: string): void {
    cy.get(this.selectors.componentSelector)
      .contains(this.selectors.tabLink, tabText)
      .should('not.exist');
  }
}

export const tabBar = new TabBar();