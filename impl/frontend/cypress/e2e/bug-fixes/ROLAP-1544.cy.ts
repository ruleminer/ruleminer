import { clickListItemByIndex } from '@e2e-helpers/devexpress/contextMenu';
import { projectRulesPredictionIndicatorsCard } from '@e2e-helpers/rolap/projectRulesPredictionIndicatorsCard';
import { renameModal } from '@e2e-helpers/rolap/renameModal';
import { treeview } from '@e2e-helpers/rolap/treeview';
import 'cypress-if';

import { ProblemTypes } from '../../../projects/rolap/src/app/main/data-upload/utils/enums';

describe('Test ROLAP-1544', () => {
  beforeEach(() => {
    cy.prepareTest();
    cy.createSampleProject(ProblemTypes.Classification);
  });

  it('Should update dataSetText inside opened ruleset when user changes dataset name from the treeView', () => {
    const NEW_DATASET_NAME = 'newDataSetName';
    treeview.openFirstRuleSet();
    treeview.rightClickOnFirstDataSet();
    clickListItemByIndex('[data-cy="context-menu"]', 6);
    renameModal.ensureModalVisible();
    renameModal.renameAndConfirm(NEW_DATASET_NAME);
    projectRulesPredictionIndicatorsCard.checkDataSetName(` ${NEW_DATASET_NAME}`);
  });
});
