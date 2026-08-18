// import { v4 } from 'uuid';

// import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums';

// describe('ROLAP-2339 check highlight selector component in column choice', () => {
//   const projectTypes = [ProblemTypes.Classification, ProblemTypes.Regression, ProblemTypes.Survival];

//   projectTypes.forEach((projectType) => {
//     describe(`Refresh all button tests for ${projectType} Project`, () => {
//       beforeEach(() => {
//         cy.prepareTest();
//       });

//       it(`Check working highlight in ${projectType} Project`, () => {
//         const notCorrectProjectName: string = `V1StGXR8_${v4()}1 . `;
//         const projectName: string = `V1StGXR8_${v4()}`;
//         const projectDescription: string = `Test project description`;

//         cy.get('[data-cy="project-add-btn"]').click({ force: true });
//         // Fill the project information
//         cy.get('[data-cy="project-name"]').type(notCorrectProjectName);
//         cy.get(`[data-cy="project-type-${projectType}"]`).click({ force: true });
//         cy.get('[data-cy="project-name-validation-message"]').should('be.visible');
//         cy.get('[data-cy="project-name"]').clear();
//         cy.get('[data-cy="project-name"]').type(projectName);

//         cy.get('[data-cy="project-description"]').type(projectDescription);
//         cy.get('[data-cy="go-to-upload-step-btn"]').click({ force: true });

//         // Upload dataset file
//         cy.get('input[type=file]').selectFile('./cypress/fixtures/iris.csv', { force: true });

//         cy.get('[data-cy="go-to-format-step-btn"]').click({ force: true });
//         cy.get('[data-cy="go-to-columns-step-btn"]').click({ force: true });

//         cy.get('[data-cy="decision-column-select"]')
//           .parent()
//           .then(($el) => {
//             if (projectType === ProblemTypes.Regression) {
//               cy.wrap($el).should('have.class', 'input-error');
//             } else {
//               cy.wrap($el).should('not.have.class', 'input-error');
//             }
//           });

//         cy.get('[data-cy="back-button"]').click({ force: true });

//         cy.get('[data-cy="has-header-checkbox"]').should('exist').click({ force: true });

//         cy.get('[data-cy="go-to-columns-step-btn"]').click({ force: true });

//         cy.get('[data-cy="decision-column-select"]').parent().should('have.class', 'input-error');
//       });
//     });
//   });
// });
