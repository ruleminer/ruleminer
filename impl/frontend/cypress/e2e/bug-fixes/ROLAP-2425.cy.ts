// import 'cypress-if';
// import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums'; 
// import { projectRulesTable } from '@e2e-helpers/rolap/projectRulesTable/projectRulesTable'; 
// import { projectRulesTableColumnChooser } from '@e2e-helpers/rolap/projectRulesTable/columnChooserBtn'; 
// import { treeview } from '@e2e-helpers/rolap/treeview'; 
// import { rulesEditor } from '@e2e-helpers/rolap/rulesEditor'; 
// import { subTabButtons } from '@e2e-helpers/rolap/subTabButtons'; 
// import { SubTabsNames } from '../../../projects/rolap/src/app/common/store/app-state.model'; 
// import { filterBuilder } from '@e2e-helpers/devexpress/filterBuilder'; 


// describe('Test: Column Chooser Interaction and Row Edit Validation', () => {
//   const projectTypes = [ProblemTypes.Regression];

//   projectTypes.forEach((projectType) =>
//     context(`For ${projectType} project`, () => {
//       beforeEach(() => {
//         cy.prepareTest();
//         cy.createSampleProject(projectType);
//       });


//       it('should show all columns via column chooser, allow editing first row, and verify no empty cells in the first row', () => {
//         treeview.openFirstRuleSet();
//         subTabButtons.goToSubTab(SubTabsNames.RULES);
//         cy.wait(1000);
//         projectRulesTableColumnChooser.clickColumnChooserButton();
//         projectRulesTableColumnChooser.assertColumnChooserVisible();
//         projectRulesTableColumnChooser.clickAllUncheckedEnabledCheckboxes();

//         projectRulesTableColumnChooser.clickColumnChooserCloseButton();
//         cy.wait(1500);
//         projectRulesTable.clickOnEditButtonInFirstElement();
//         rulesEditor.submitButtonShouldBeVisible();

//         if (projectType === ProblemTypes.Classification) {
//           filterBuilder.addCondition();
//           filterBuilder.fillConditionRow(1, {
//             field: 'hair',
//             operator: '=',
//             value: 'False',
//             valueInputTypeHint: 'select'
//           });
//         } else if (projectType === ProblemTypes.Regression) {
//           filterBuilder.addCondition();
//           const scrollDownInModal = (times = 2) => {
//           let currentScroll = 0;

//           const scroll = () => {
//             if (currentScroll >= times) return cy.wrap(null);
//             return cy
//               .get('rolap-project-rules-table-editor .dx-scrollable-container')
//               .first()
//               .trigger('wheel', {
//                 deltaY: 100,
//                 wheelDelta: -100,
//                 wheelDeltaX: 0,
//                 wheelDeltaY: -100,
//                 bubbles: true,
//               })
//               .wait(100) 
//               .then(() => {
//                 currentScroll++;
//                 return scroll();
//               });
//           };

//           return scroll();
//         };

//           scrollDownInModal().then(() => {
//  filterBuilder.fillConditionRow(4, {
//             field: 'CRIM',
//             operator: '<',
//             value: 900,
//             valueInputTypeHint: 'numeric'
//           });
//           });
         
//         } else {
//           filterBuilder.addCondition();
//           filterBuilder.fillConditionRow(3, {
//             field: 'donor_age',
//             operator: '<',
//             value: 900,
//             valueInputTypeHint: 'numeric'
//           });
//         }

//         rulesEditor.submitRule();
//         cy.get('rolap-project-rules-table-editor').should('not.exist');

//         cy.wait(1500);

//         cy.get('[data-cy="rules-big-table"] .dx-datagrid-rowsview .dx-data-row[aria-rowindex="1"]')
//           .find('td')
//           .should('have.length.greaterThan', 0)
//           .each(($td, index) => {
//             cy.wrap($td).invoke('text').then((text) => {
//               const trimmedText = text.trim();
//               cy.log(`Checking cell index: ${index}, Text: "${trimmedText}"`);

//               const isCommandCell = $td.hasClass('dx-command-edit');
//               const containsBoxPlotComponent = $td.find('rolap-regression-rule-conclusion-boxplot').length > 0;
//               const containsSurvivalRuleEstimatorCurveComponent = $td.find('rolap-survival-rule-estimator-curve').length > 0;
//               const isRegressionBoxPlotCell = projectType === ProblemTypes.Regression && containsBoxPlotComponent;
//               const isSurvivalCurve = projectType === ProblemTypes.Survival && containsSurvivalRuleEstimatorCurveComponent;
//               if (!isCommandCell && !isRegressionBoxPlotCell && !isSurvivalCurve) {
//                 cy.wrap(trimmedText).should('not.be.empty');
//               } else {
//                 cy.log(`Skipping assertion for cell index: ${index} (Command or Regression BoxPlot)`);
//               }
//             });
//           });
//       });
//     })
//   );
// })