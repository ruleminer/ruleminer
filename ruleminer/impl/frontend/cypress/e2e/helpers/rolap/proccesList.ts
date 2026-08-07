/**
 * Represents a process list.
 */
/**
 * Represents a process list.
 */
class ProcessList {
  private selectors = {
    processLink: '[data-cy="process-link"]',
    refreshBtn: '[data-cy="refresh-btn"]',
    processEffect: '[data-cy="process-effect"]',
  };

  /**
   * Clicks on the process link and verifies its visibility.
   */
  public clickProcessLink() {
    cy.get(this.selectors.processLink).should('be.visible').click({ force: true });
  }

  /**
   * Clicks on the refresh button and verifies its visibility.
   */
  public clickRefreshButton() {
    const pendingTasksEndpoint = '**/api/tasks/project/*?*status__in=PENDING,STARTED,STOPPING*';
    const completedTasksEndpoint = '**/api/tasks/project/*?*status__in=SUCCESS,FAILURE,ABORTED,STOPPED*';
  
    cy.intercept('GET', pendingTasksEndpoint).as('refreshPending');
    cy.intercept('GET', completedTasksEndpoint).as('refreshCompleted');
  
    cy.get(this.selectors.refreshBtn).first().click({ force: true });
  
    cy.wait(['@refreshPending', '@refreshCompleted'], { timeout: 120000 });
  
    cy.get(this.selectors.refreshBtn).should('be.visible');
  }

  /**
   * Clicks on the process effect.
   */
  public clickProcessEffect() {
    cy.get(this.selectors.processEffect).first().click({ force: true });
  }

  /**
   * Navigates to a process and waits for a rule.
   */
  public goToProcessAndWaitForRule() {
    this.clickProcessLink();
    cy.wait(10000);
    this.clickRefreshButton();
    this.clickProcessEffect();
  }
}

export const processList = new ProcessList();
