// import { v4 } from 'uuid';

// import { AppLanguages } from '@e2e-helpers/types';

// describe('Create and delete classification project', () => {
//   beforeEach(() => {
//     cy.viewport(1000, 1200); // Set the viewport size to 1000x1200
//     cy.prepareTest();
//     cy.changeLanguage(AppLanguages.PL);
//   });

//   it('passes', () => {
//     const decisionColumnName = 'target';
//     const notCorrectProjectName: string = `V1StGXR8_${v4()}1 . `;
//     const projectName: string = `V1StGXR8_${v4()}`;
//     const projectDescription: string = `Test project description`;

//     cy.get('[data-cy="project-add-btn"]').click({ force: true });

//     // Fill the project information
//     cy.get('[data-cy="project-name"]').type(notCorrectProjectName);
//     cy.get('[data-cy="project-type-classification"]').click({ force: true });
//     cy.get('[data-cy="project-name-validation-message"]').should('be.visible');
//     cy.get('[data-cy="project-name"]').clear();
//     cy.get('[data-cy="project-name"]').type(projectName);

//     cy.get('[data-cy="project-description"]').type(projectDescription);
//     cy.get('[data-cy="go-to-upload-step-btn"]').click({ force: true });

//     // Upload dataset file
//     cy.get('input[type=file]').selectFile('./cypress/fixtures/iris.csv', { force: true });

//     cy.get('[data-cy="go-to-format-step-btn"]').click({ force: true });
//     cy.get('[data-cy="go-to-columns-step-btn"]').click({ force: true });

//     // Explicitly select decision column if not auto-selected
//     cy.get('[data-cy="decision-column-select"]').click({ force: true });

//     // Wait for the dropdown options to be fully rendered and visible
//     cy.get('.dx-scrollview-content .dx-item-content')
//       .should('be.visible')
//       .contains(decisionColumnName)
//       .click({ force: true });

//     // Check if decision column is correctly selected
//     cy.get('[data-cy="decision-column-select"] input').should('have.value', decisionColumnName);

//     cy.get('[data-cy="go-to-dataset-info-step-btn"]').click({ force: true });

//     // Fill the dataset information
//     cy.get('[data-cy="dataset-name"]').type('Test dataset');
//     cy.get('[data-cy="dataset-description"]').type('Test dataset description');

//     // Prepare to intercept the project submission
//     cy.get('[data-cy="submit-btn"]').click({ force: true });
//     cy.wait(5000);

//     cy.get('.dx-datagrid-headers .dx-row.dx-header-row td').eq(2).click({ force: true });

//     cy.get('.dx-datagrid-rowsview').should('be.visible');

//     cy.get('[data-cy="dataset-table"]').should('be.visible');
//     cy.get('[data-cy="dataset-table"]')
//       .find('tbody[role="presentation"]')
//       .eq(1)
//       .find('tr')
//       .eq(0)
//       .find('td')
//       .eq(0)
//       .should('have.text', '15');
//   });
// });
