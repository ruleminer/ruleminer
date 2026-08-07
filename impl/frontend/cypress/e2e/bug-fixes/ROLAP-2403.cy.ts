// // import 'cypress-if';
// // import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';
// // import { clickListItemByIndex } from '@e2e-helpers/devexpress/contextMenu';
// // import { treeview } from '@e2e-helpers/rolap/treeview';
// // import { expertInductionHelper } from '@e2e-helpers/rolap/expertInduction';
// // import { rulesEditorSideColumnHelper } from '@e2e-helpers/rolap/ruleEditroSideColumn';
// // import { filterBuilder } from '@e2e-helpers/devexpress/filterBuilder';
// // import { rulesEditor } from '@e2e-helpers/rolap/rulesEditor';


// // describe('Generate Ruleset with User-Driven Induction and Preferred Conditions', () => {
// //   Object.values(ProblemTypes).forEach((projectType) => {
// //     context(`For ${projectType} project`, () => {
// //       beforeEach(() => {
// //         cy.prepareTest();
// //         cy.createSampleProject(projectType);
// //       });

// //       it(`should open ${projectType}, right-click dataset, generate ruleset, select user-driven induction, open preferred conditions modal, and select first 3 classes`, () => {
// //         treeview.rightClickOnFirstDataSet();

// //         clickListItemByIndex('[data-cy="context-menu"]', 0);

// //         const scrollDownInModal = (times = 10) => {
// //           let currentScroll = 0;

// //           const scroll = () => {
// //             if (currentScroll >= times) return cy.wrap(null);

// //             return cy
// //               .get('rolap-project-generate-rule-set-modal .dx-scrollable-container')
// //               .trigger('wheel', {
// //                 deltaY: 100,
// //                 wheelDelta: -100,
// //                 wheelDeltaX: 0,
// //                 wheelDeltaY: -100,
// //                 bubbles: true,
// //               })
// //               .wait(100)
// //               .then(() => {
// //                 currentScroll++;
// //                 return scroll();
// //               });
// //           };

// //           return scroll();
// //         };

// //         scrollDownInModal().then(() => {
// //           cy.contains('Indukcja reguł sterowana przez użytkownika', { timeout: 10000 })
// //             .should('be.visible')
// //             .click({ force: true });
// //         });
// //         expertInductionHelper.toggleExpertInduction(true);
// //         expertInductionHelper.assertVisible();
// //         expertInductionHelper.assertExpanded(true);
// //         expertInductionHelper.clickAddPreferredCondition();

//         if (projectType === ProblemTypes.Classification) {
//           rulesEditorSideColumnHelper.selectNominalAttributes([0, 1, 2]);
//         }

//         if (projectType === ProblemTypes.Classification) {
//           filterBuilder.addCondition();
//           filterBuilder.fillConditionRow(0, {
//             field: 'hair',
//             operator: '=',
//             value: 'False',
//             valueInputTypeHint: 'select'
//           });
//         } else if (projectType === ProblemTypes.Regression) {
//           filterBuilder.addCondition();
//           filterBuilder.fillConditionRow(0, {
//             field: 'CRIM',
//             operator: '<',
//             value: 900,
//             valueInputTypeHint: 'numeric'
//           });
//         } else {
//           filterBuilder.addCondition();
//           filterBuilder.fillConditionRow(0, {
//             field: 'donor_age',
//             operator: '<',
//             value: 900,
//             valueInputTypeHint: 'numeric'
//           });
//         }
//         rulesEditorSideColumnHelper.setPreferredCount(3)

// //         rulesEditor.submitRule()

// //       });
// //     });
// //   });
// // });