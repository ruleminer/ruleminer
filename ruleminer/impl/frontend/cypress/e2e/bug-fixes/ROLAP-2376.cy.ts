// import { SubTabsNames } from '../../../projects/rolap/src/app/common/store/app-state.model';
// import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums';
// import { projectRulesTable } from '@e2e-helpers/rolap/projectRulesTable/projectRulesTable';
// import { subTabButtons } from '@e2e-helpers/rolap/subTabButtons';
// import { treeview } from '@e2e-helpers/rolap/treeview';
// import { createDevExtremeDataGrid } from '../helpers/devexpress/DataGrid/dataGird';

// describe('Test ROLAP-2376', () => {
//   const expectedValuesMap = {
//     [ProblemTypes.Classification]: {
//       expectedValue: ['bird', '1', '1'],
//       columnsIndex: [5, 6, 7],
//     },
//     [ProblemTypes.Regression]: {
//       expectedValue: ['25.4', '26.87'],
//       columnsIndex: [7, 8],
//     },
//     [ProblemTypes.Survival]: {
//       expectedValue: ['inf', '1'],
//       columnsIndex: [6, 7],
//     },
//   };

//   Object.values(ProblemTypes).forEach((problemType) => {
//     context(`For ${problemType} project`, () => {
//       beforeEach(() => {
//         cy.prepareTest();
//         cy.createSampleProject(problemType);
//       });

//       it('Check values in table after manually added rules', () => {
//         treeview.openFirstRuleSet();
//         subTabButtons.goToSubTab(SubTabsNames.RULES);
//         projectRulesTable.addNewRuleFromExistingRuleset();

//         const { expectedValue, columnsIndex } = expectedValuesMap[problemType];
//         cy.wait(5000);
//         const dataGrid = createDevExtremeDataGrid('rolap-project-rules-table');
//         dataGrid.assertExist();
//         dataGrid.loader.assertNoLoader();
//         columnsIndex.forEach((indexVal, i) => {
//           cy.wait(9000);
//           projectRulesTable.checkNColumnTextsInTable(indexVal, [expectedValue[i]]);
//         });
//       });
//     });
//   });
// });