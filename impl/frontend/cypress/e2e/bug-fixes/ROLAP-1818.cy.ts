import { labels } from '@e2e-helpers/rolap/labels';
import { treeview } from '@e2e-helpers/rolap/treeview';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

describe('Test ROLAP-1818', () => {
  const testLabel1 = labels.testLabelName + '-1';
  const testLabel2 = labels.testLabelName + '-2';

  beforeEach(() => {
    cy.prepareTest();
    cy.createSampleProject(ProblemTypes.Classification);
  });

  it('When removing a label that is not assigned to any of the rules. A redundant label should not appear in a rule with labels', () => {
    treeview.openFirstRuleSet();

    labels.removeTestLabel(labels.testLabelName);
    labels.removeTestLabel(testLabel1);
    labels.removeTestLabel(testLabel2);
    labels.openLabelEditor(0);
    labels.addLabelInEditor(testLabel1);
    labels.addLabelInEditor(testLabel2);
    labels.addTestLabelToRule(testLabel1);

    // remove label from DB
    labels.openLabelEditor(1);
    labels.removeLabelFromDB(testLabel2);

    // in first row should be only one label
    labels.checkNumberOfLabelsInRow(1, 0);
  });
});
