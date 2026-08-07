
class ProcessTabInfo {
  private selectors = {
    componentSelector: 'rolap-process-tab-info',
    optionalContentParagraph: 'rolap-process-tab-info p:first-child',
    followProcessParagraph: 'rolap-process-tab-info p:nth-child(2)',
    processLinkButton: '[data-cy="process-link"]',
  };

  public assertComponentVisible(): void {
    cy.get(this.selectors.componentSelector).should('be.visible');
  }

  public assertComponentNotVisible(): void {
    cy.get(this.selectors.componentSelector).should('not.exist');
  }

  public assertOptionalContentVisible(): void {
    cy.get(this.selectors.optionalContentParagraph).should('be.visible');
  }



  public assertOptionalContentNotVisible(): void {
    cy.get(this.selectors.followProcessParagraph).should('be.visible');
    cy.get(this.selectors.optionalContentParagraph).should('not.exist');
  }


  public assertProcessLinkButtonVisible(): void {
    cy.get(this.selectors.processLinkButton).should('be.visible');
  }

  public assertProcessLinkButtonText(expectedText: string): void {
    cy.get(this.selectors.processLinkButton).should('contain.text', expectedText);
  }

  public clickProcessLinkButton(): void {
    const pendingTasksEndpoint = '**/api/tasks/project/*?*status__in=PENDING,STARTED,STOPPING*';
    const completedTasksEndpoint = '**/api/tasks/project/*?*status__in=SUCCESS,FAILURE,ABORTED,STOPPED*';

    cy.intercept('GET', pendingTasksEndpoint).as('getPendingTasks');
    cy.intercept('GET', completedTasksEndpoint).as('getCompletedTasks');

    cy.get(this.selectors.processLinkButton).should('be.visible').click({ force: true });

    cy.wait(['@getPendingTasks', '@getCompletedTasks'], { timeout: 120000 });
    cy.wait(['@getPendingTasks', '@getCompletedTasks'], { timeout: 120000 });
}
}

export const processTabInfo = new ProcessTabInfo();