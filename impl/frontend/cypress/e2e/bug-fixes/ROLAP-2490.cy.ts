// import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums';
// import { clickListItemByIndex } from '../helpers/devexpress/contextMenu';
// import { treeview } from '../helpers/rolap/treeview';

// describe('Test ROLAP-2490', () => {
//   beforeEach(() => {
//     cy.prepareTest();
//     cy.createSampleProject(ProblemTypes.Survival);
//   });

//   it.only('Should be able to add rules when manually creating ruleset in Regression project', () => {
//     treeview.rightClickOnFirstDataSet();
//     clickListItemByIndex('[data-cy="context-menu"]', 0);

//     cy.get('[data-cy="rules-generate-algorithm--Manually"]').click({ force: true });
//     cy.get('[data-cy="add-rule-manual-btn"]').click({ force: true });

//     cy.wait(1000);
//     cy.get('.dx-icon-plus.dx-filterbuilder-action').should('be.visible').click({ force: true });
//     cy.get('.dx-filterbuilder-item-value-text').click({ force: true });

//     cy.wait(300);
//     cy.get('.dx-texteditor-input:visible').last().type('3', { force: true });

//     cy.get('.dx-texteditor-input:visible').last().type('{enter}', { force: true });

//     cy.wait(500);

//     cy.get('[data-cy="no-examples-covered-error"]').should('be.visible');
//   });
// });
