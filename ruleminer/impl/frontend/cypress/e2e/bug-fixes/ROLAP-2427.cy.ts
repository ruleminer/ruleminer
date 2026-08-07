import { ProblemTypes } from "../../../projects/rolap/src/app/main/data-upload/utils/enums";
import { processList } from "../helpers/rolap/proccesList";
import { processTabInfo } from "../helpers/rolap/processTabInfo";
import { tabBar } from "../helpers/rolap/tabBar";
import { treeview } from "../helpers/rolap/treeview";
import { saveRulesetModal } from "../helpers/saveRulesTableModal";

describe('Save Ruleset As Test', () => {
  Object.values(ProblemTypes).forEach((projectType) => {
    context(`For ${projectType} project`, () => {
      const newRulesetName = 'ruleset2';
      const originalRulesetTabName = 'ruleset';
      const processTabName = 'Procesy';


      beforeEach(() => {
        cy.prepareTest();
        cy.createSampleProject(projectType);
      });

      it(`should save ruleset as ${newRulesetName}, process, and verify active ruleset tab`, () => {
        let datasetTabName: string;
        if (projectType === ProblemTypes.Regression) {
          datasetTabName = 'boston-housing';
        } else if (projectType === ProblemTypes.Survival) {
          datasetTabName = 'bone-marrow';
        } else {
          datasetTabName = 'zoo-dataset';
        }

        treeview.openFirstRuleSet();
        cy.get('[data-cy="rolap-rule-table-save-button"]').should('be.visible').click({ force: true });

        saveRulesetModal.ensureModalVisible();
        saveRulesetModal.toggleOverwriteCheckbox();
        saveRulesetModal.typeName(newRulesetName);
        saveRulesetModal.clickSaveButton();
        saveRulesetModal.ensureModalNotVisible();

        processTabInfo.assertComponentVisible();
        processTabInfo.assertOptionalContentVisible();
        processTabInfo.assertProcessLinkButtonVisible();

        processTabInfo.clickProcessLinkButton();

        cy.wait(10000);
        processList.clickRefreshButton();
        processList.clickProcessEffect();
        cy.wait(10000);


        tabBar.assertVisible();
        tabBar.assertTabExists(datasetTabName);
        tabBar.assertTabExists(originalRulesetTabName);
        tabBar.assertTabExists(processTabName);
        tabBar.assertTabExists(newRulesetName);

        tabBar.assertActiveTabText(newRulesetName);
        tabBar.assertTabIsActive(newRulesetName);

      });
    });
  });
});