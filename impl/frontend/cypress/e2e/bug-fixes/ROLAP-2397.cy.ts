import { v4 } from 'uuid';

import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums';

describe('ROLAP-2397 check selected columns when user change file to similar in column choice', () => {
  beforeEach(() => {
    cy.prepareTest();
  });

  it(`Check working checkbox in file format in ${ProblemTypes.Classification} Project`, () => {
    const notCorrectProjectName: string = `V1StGXR8_${v4()}1 . `;
    const projectName: string = `V1StGXR8_${v4()}`;
    const projectDescription: string = `Test project description`;

    cy.get('[data-cy="project-add-btn"]').click({ force: true });
    cy.get('[data-cy="project-name"]').type(notCorrectProjectName);
    cy.get(`[data-cy="project-type-${ProblemTypes.Classification}"]`).click({ force: true });
    cy.get('[data-cy="project-name-validation-message"]').should('be.visible');
    cy.get('[data-cy="project-name"]').clear();
    cy.get('[data-cy="project-name"]').type(projectName);

    cy.get('[data-cy="project-description"]').type(projectDescription);
    cy.get('[data-cy="go-to-upload-step-btn"]').click({ force: true });

    // Upload dataset file
    cy.get('input[type=file]').selectFile('./cypress/fixtures/laptop_data1.csv', { force: true });

    cy.get('[data-cy="go-to-format-step-btn"]').click({ force: true });
    const headerIndexes = [4, 5, 6];

    for (const index of headerIndexes) {
      const checkboxHeder = cy.get(`[data-cy="header-upload-${index}"]`).should('exist').find('input');
      checkboxHeder.click({ force: true });
    }

    cy.get('[data-cy="back-button-to-file-upload"]').click({ force: true });

    cy.get('input[type=file]').selectFile('./cypress/fixtures/laptop_data2.csv', { force: true });

    cy.get('[data-cy="go-to-format-step-btn"]').click({ force: true });

    for (const index of headerIndexes) {
      cy.get(`[data-cy="header-upload-${index}"]`)
        .find('.dx-checkbox')
        .should('have.class', 'dx-checkbox')
        .should('not.have.class', 'dx-checkbox-checked');
    }
  });
});
