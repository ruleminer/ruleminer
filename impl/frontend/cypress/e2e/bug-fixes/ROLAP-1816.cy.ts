import 'cypress-if';
import { subTabButtons } from '@e2e-helpers/rolap/subTabButtons';
import { SubTabsNames } from 'projects/rolap/src/app/common/store/app-state.model';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { prediction } from '@e2e-helpers/rolap/prediction';
import { treeview } from '@e2e-helpers/rolap/treeview';

describe('Test ROLAP-1816', () => {
  beforeEach(() => {
    cy.prepareTest();
  });

  it(`Verify the existence of the confusion matrix (ProblemType - ${ProblemTypes.Classification})`, () => {
    cy.createSampleProject(ProblemTypes.Classification);

    treeview.openFirstRuleSet();
    subTabButtons.goToSubTab(SubTabsNames.PREDICTION_STATISTICS);

    prediction.checkConfusionMatrixExistence(ProblemTypes.Classification);
  });

  it(`Verify the existence of the confusion matrix (ProblemType - ${ProblemTypes.Regression})`, () => {
    cy.createSampleProject(ProblemTypes.Regression);

    treeview.openFirstRuleSet();
    subTabButtons.goToSubTab(SubTabsNames.PREDICTION_STATISTICS);

    prediction.checkConfusionMatrixExistence(ProblemTypes.Regression);
  });

  it(`Verify the existence of the confusion matrix (ProblemType - ${ProblemTypes.Survival})`, () => {
    cy.createSampleProject(ProblemTypes.Survival);

    treeview.openFirstRuleSet();
    subTabButtons.goToSubTab(SubTabsNames.PREDICTION_STATISTICS);

    prediction.checkConfusionMatrixExistence(ProblemTypes.Survival);
  });
});
