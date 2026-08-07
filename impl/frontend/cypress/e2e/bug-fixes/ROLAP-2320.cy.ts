// import { SubTabsNames } from '../../../projects/rolap/src/app/common/store/app-state.model';
// import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums';
// import { filterBuilder } from '@e2e-helpers/devexpress/filterBuilder';
// import { rulesEditor } from '@e2e-helpers/rolap/rulesEditor';
// import { subTabButtons } from '@e2e-helpers/rolap/subTabButtons';
// import { treeview } from '@e2e-helpers/rolap/treeview';

// describe('ROLAP-2320 Test Profile Guard', () => {
//   beforeEach(() => {
//     cy.prepareTest();
//     cy.createSampleProject(ProblemTypes.Classification);
//   });

//   it('Should not be able to navigate to rules tab if there is only one modal open', () => {
//     // Open the rule set
//     treeview.openFirstRuleSet();
//     subTabButtons.goToSubTab(SubTabsNames.RULES);

//     rulesEditor.addNewRule();

//     cy.wait(1000);
//     filterBuilder.addCondition();
//     filterBuilder.fillConditionRow(0, {
//       field: 'hair',
//       operator: '=',
//       value: 'False',
//       valueInputTypeHint: 'select'
//     });

//     cy.get('[data-cy="user-info-menu"]').should('exist').click();

//     cy.get('[data-cy="go-to-profile-btn"]').should('exist').click({ force: true });

//     cy.get('#modal-content').should('exist');

//     // Verify that URL does not change to /profile when rule editor is open
//     cy.url().should('not.include', '/profile');
//   });
// });
