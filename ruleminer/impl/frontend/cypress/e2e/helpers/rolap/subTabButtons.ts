import { SubTabsNames } from '@e2e-helpers/../../projects/rolap/src/app/common/store/app-state.model';

//* Helper for <rolap-sub-tab-buttons />
// This utility can be used to switch between sub-tabs in the ruleset and dataset sections.
class SubTabButtons {
  private getSubTabSelector(subTabName: SubTabsNames): string {
    return `[data-cy="sub-tab-btn-${subTabName}"]`;
  }

  goToSubTab(subTabName: SubTabsNames): void {
    const subTabSelector = this.getSubTabSelector(subTabName);

    cy.get(subTabSelector).should('be.visible').as('subTabButton');
    cy.get('@subTabButton').click({ force: true });
    cy.wait(300);
    cy.get(subTabSelector).should('have.class', 'active');
  }
}

export const subTabButtons = new SubTabButtons();
