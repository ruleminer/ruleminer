/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
import { getConfig } from 'cypress/utils/environments';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { clickListItemByIndex } from '@e2e-helpers/devexpress/contextMenu';
import { AppLanguages } from '@e2e-helpers/types';

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
Cypress.Commands.add('login' as any, () => {
  const config = getConfig();
  cy.visit(config.appUrl);
  cy.origin(config.auth.baseUrl, { args: config }, (config) => {
    cy.get('#username').type(config.auth.username);
    cy.get('#password').type(config.auth.password);
    cy.get('#kc-login').click({ force: true });
  });
  // on each test run a new store version modal is shown and must be closed
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="new-store-version-modal-close-button"]').length > 0) {
      cy.get('[data-cy="new-store-version-modal-close-button"]').should('be.visible').click({ force: true });
    }
  });
});

Cypress.Commands.add('deleteProject', () => {
  cy.get('[data-cy="recent-project-loader"]').should('not.exist');
  cy.wait(3000);

  cy.get('body').then(($body) => {
    const projectElement = $body.find('[data-cy="project-tile"]').first();

    if (projectElement.length) {
      const projectId = projectElement.attr('id');
      if (projectId) {
        const truncatedProjectId = Number(projectId.split('-')[2]);

        // Right-click on the project tile
        cy.wrap(projectElement).rightclick({ force: true });

        // Click the menu item and delete the project
        clickListItemByIndex(`[data-cy="tile-context-menu--${truncatedProjectId}"]`, 1);
        cy.get('[data-cy="delete-project-btn"]')
          .should('exist')
          .and('be.visible')
          .then(($deleteBtn) => {
            if ($deleteBtn.length) {
              cy.wrap($deleteBtn).click({ force: true });
              cy.log(`Project with ID ${truncatedProjectId} deleted.`);
            }
          });
      }
    } else {
      cy.log('No project tiles found. Nothing to delete.');
    }
  });
});

Cypress.Commands.add('createSampleProject', (problemType: ProblemTypes) => {
  const config = getConfig();
  cy.visit(`${config.appUrl}/projects`);
  cy.wait(500)
  cy.get(`[data-cy="sample_project_${problemType}"]`).should('exist').click({ force: true });
  // cy.url().should('match', /\/projects\/\d+$/gm);
});

Cypress.Commands.add('changeLanguage', (lang: AppLanguages) => {
  console.log('Attempting to change language to:', lang);
  cy.wait(500);

  cy.get('[data-cy="user-info-menu"]').should('exist').click({ force: true });
  cy.wait(500);

  cy.get('[data-cy="go-to-profile-btn"]').should('exist').click({ force: true });
  cy.wait(500);

  cy.get('[data-cy="lang-select"]').should('exist').within(() => {
    cy.get('.dx-dropdowneditor-button').should('be.visible').click({ force: true });
  });

  cy.wait(500);

  cy.get('.dx-dropdowneditor-overlay .dx-list-item-content', { timeout: 10000 })
    .should('be.visible');

  cy.get(`[data-cy="${lang}"]`).should('exist').scrollIntoView().click({ force: true });
  cy.wait(500);

  cy.get('[data-cy="logo"]').should('exist').click({ force: true });
  cy.wait(500);

  cy.get('[data-cy="project-sample-projects"]')
    .should('exist')
    .and('contain', lang === AppLanguages.EN ? 'Sample projects' : 'Przykładowe projekty');
  cy.wait(500);
});

Cypress.Commands.add('closeTourModal', () => {
  cy.wait(500);
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="tour-modal-cancel-btn"]').length > 0) {
      cy.get('[data-cy="tour-modal-cancel-btn"]').should('exist').click({ force: true });
    } else {
      cy.log('Tour was setup earlier - skipping');
    }
  });
});

Cypress.Commands.add('prepareTest', () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.login();
  cy.closeTourModal();
  cy.changeLanguage(AppLanguages.PL);
  cy.deleteProject();
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
      /** Delete most recently created project.
       * This command must be called from the project details view or you must provide the project name to delete.
       * */
      deleteProject(): Chainable<void>;
      /**
       * Create sample project by clicking sample projects tiles on project
       * list view. It automatically navigates to project details view and wait
       * for it to load.
       *
       * @param problemType problem type
       */
      createSampleProject(problemType: ProblemTypes): Chainable<void>;
      changeLanguage(lang: AppLanguages): Chainable<void>;
      closeTourModal(): Chainable<void>;

      /**
       * Prepare test by clearing cookies, clearing local storage, logging in,
       * changing language to Polish, and deleting any existing project.
       */
      prepareTest(): Chainable<void>;
    }
  }
}
