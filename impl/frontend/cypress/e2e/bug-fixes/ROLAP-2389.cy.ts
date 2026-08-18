// import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums';
// import { generateRulesetModal } from '../helpers/rolap/generateRulesetModal';
// import { processList } from '../helpers/rolap/proccesList';
// import { treeview } from '../helpers/rolap/treeview';


// describe('Test ROLAP-2389', () => {
//   Object.values(ProblemTypes).forEach((problemType) => {
//     context(`For ${problemType} project`, () => {
//       beforeEach(() => {
//         cy.prepareTest();
//         cy.createSampleProject(problemType);
//       });

//       it(`Check effect on process page in ${problemType}`, () => {
//         treeview.openContextMenuOnFirstDataSet();
//         cy.wait(1000);
//         generateRulesetModal.generateNewRuleset();
//         cy.wait(1000);
//         processList.clickProcessLink();

//         cy.wait(20000);
//         processList.clickRefreshButton();
//         cy.wait(2000);
//         processList.clickProcessEffect();
//       });
//     });
//   });
// });
