//* Helper for <rolap-treeview />
import { manualRuleGenerator } from '@e2e-helpers/rolap/manualRuleGenerator';
import { clickListItemByIndex } from '../devexpress/contextMenu';

// This utility provides methods to interact with the Treeview component.
class Treeview {
  private selectors = {
    dataset: '[data-cy="tree-item-dataset"]',
    rulesetsGroup: '[data-cy="tree-item-rulesets_group"]',
    dataSet: '[data-cy="tree-item-dataset"]',
    ruleSet: '[data-cy="tree-item-ruleSet"]',
    projectRules: 'rolap-project-rules',
    rolapTreeDataSet: '[data-cy="modal-tree-item-dataset"]',
    rolapTreeRuleSet: '[data-cy="modal-tree-item-ruleset"]',
  };

  // Open the first rule set in the tree view
  public openFirstRuleSet(): void {
    const requestsToWaitFor = [
      'GET', '**/api/datasets/*/rulesets/*/prediction_indicators',
      'GET', '**/api/datasets/*/rulesets/*/quantitative_characteristic',
      'GET', '**/api/datasets/*/rulesets/*/importance',
      'GET', '**/api/datasets/*/rulesets/*/crossvalidation',
      'GET', '**/api/datasets/*/rulesets/*/details',
      'POST', '**/api/datasets/*/preview?limit=1&offset=0',
      'GET', '**/api/datasets/*/rulesets/*/rules_coverage',
      'GET', '**/api/datasets/*/rulesets/*/rules_indicators',
      'GET', '**/api/rulesets/*/labels',
      'GET', '**/calculate/comparison_measures',
      'GET', '**/api/datasets/*/attributes',
      'GET', '**/api/datasets/*/statistics',
      'GET', '**/api/datasets/*/rulesets/*/comments',
    ];
  
    for (let i = 0; i < requestsToWaitFor.length; i += 2) {
      cy.intercept(requestsToWaitFor[i], requestsToWaitFor[i + 1]).as(`getRuleData${i / 2}`);
    }
  
    const aliasesToWaitFor = Array.from({ length: requestsToWaitFor.length / 2 }, (_, i) => `@getRuleData${i}`);
  
    cy.get(this.selectors.dataset).should('exist').dblclick();
    cy.get(this.selectors.rulesetsGroup).should('exist').dblclick();
    cy.get(this.selectors.ruleSet).should('exist').click({ force: true });
  
    cy.wait(aliasesToWaitFor, { timeout: 120000 });
  
    cy.get(this.selectors.projectRules).should('be.visible');
  }

  /**
   * Selects rules from another dataset.
   */
  public selectRulesFromAnotherDataset() {
    manualRuleGenerator.clickAnotherRulesButton();
    cy.get(this.selectors.rolapTreeDataSet).should('be.visible').dblclick({ force: true });
    cy.get(this.selectors.rolapTreeDataSet).click({ force: true });
    cy.get(this.selectors.rolapTreeDataSet).click({ force: true });
    cy.get(this.selectors.rolapTreeRuleSet).click({ force: true });
  }

  /**
   * Right click on the first data set in the tree view.
  // Open the first dataset in the tree view
  */
  public openFirstDataSet(): void {
    cy.get(this.selectors.dataset).should('exist').dblclick();
  }

  /**
   * Right-clicks on the first data set in the tree view.
   */
  public rightClickOnFirstDataSet(): void {
    cy.get(this.selectors.dataset).rightclick();
  }

  /**
   * Opens the context menu for the first dataset.
   */
  public openContextMenuOnFirstDataSet(): void {
    this.rightClickOnFirstDataSet();
    clickListItemByIndex('[data-cy="context-menu"]', 0);
  }
}

export const treeview = new Treeview();
