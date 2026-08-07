// import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums';
// import { clickListItemByIndex } from '../../helpers/devexpress/contextMenu';

// describe('Create and delete sample classification project', () => {
//   beforeEach(() => {
//     cy.clearCookies();
//     cy.clearLocalStorage();
//     cy.login();
//     cy.deleteProject();
//     cy.createSampleProject(ProblemTypes.Classification);
//   });

//   it('should create, process, and delete the project successfully', () => {
//     cy.get('[data-cy="tree-item-dataset"]').should('be.visible').rightclick();
//     clickListItemByIndex('[data-cy="context-menu"]', 0);

//     cy.get('[data-cy="cross-validation-checkbox"]').click({ force: true });
//     cy.get('[data-cy="cross-validation-numfolds"]').clear().type('3');

//     cy.get('[data-cy="generate-button"]').should('be.visible').click({ force: true });
//     cy.wait(200);
//     cy.get('[data-cy="process-link"]').click({ force: true });

//     cy.wait(20000);

//     cy.get('[data-cy="refresh-btn"]').first().click({ force: true });

//     cy.wait(500);
//     cy.get('[data-cy="process-effect"]').first().click({ force: true });

//     cy.wait(200);

//     cy.get('[data-cy="rules_count"]').parent('td').next('td').should('contain', '7');
//   });
// });
