// This utility provides methods to interact with rules tables in the project.
import { ProblemTypes } from '../../../../../projects/rolap/src/app/main/data-upload/utils/enums';
import { manualSelectRules } from '../manualSelectRules';

export class ProjectRulesTable {
  private selectors: any = {};
  constructor(private tableSelector: string = 'rules-big-table') {
    this.selectors = {
      deleteRuleButton: '[data-cy="project-rules-table-delete-rule-button"]',
      confirmPopupYesButton:
        'body > div.dx-dialog.dx-overlay.dx-popup.dx-widget.dx-visibility-change-handler > div > div > div.dx-toolbar.dx-widget.dx-visibility-change-handler.dx-collection.dx-popup-bottom.dx-dialog-buttons > div > div.dx-toolbar-center > div:nth-child(1) > div > div > div',
      firstRuleTableCell: 'rolap-project-rules-table tbody > tr:first-child > td:nth-child(2)',
      ruleVisibilityToggle: (ruleIndex: number) => `[data-cy="rule-visibility-toggle--${ruleIndex + 1}"]`,
      ruleFilterToggle: (ruleIndex: number) => `[data-cy="rule-filter-toggle--${ruleIndex + 1}"]`,
      comparisonCheckbox: (rowIndex: number) =>
        `rolap-project-rules-table [aria-rowindex="${rowIndex}"] > .dx-command-edit > .dx-template-wrapper > rolap-rules-table-comparison-cell > .ng-star-inserted > .dx-widget > .dx-checkbox-container > .dx-checkbox-icon`,
      addRuleButton: '[data-cy="rules-add-new"]',
      addRuleFromAnotherRulesetButton: '[data-cy="add-rule-from-another-ruleset-btn"]',
      modalTreeItemDataSet: '[data-cy="modal-tree-item-dataset"]',
      modalTreeItemRuleSet: '[data-cy="modal-tree-item-ruleset"]',
      rulesManualSelectTable: 'rolap-manual-select-rule',
      rulesManualSelectTableAcceptButton: '[data-cy="manual-select-rule-accept-button"]',
      rulesManualRuleGeneratorAcceptButton: '[data-cy="add-rules-to-big-table"]',
      table: `[data-cy="${this.tableSelector}"]`,
      tbody: 'tbody[role="presentation"]',
    };
  }

  // Delete the first rule by clicking the delete button and confirming the deletion
  public deleteFirstRule(): void {
    this.clickFirstDeleteRuleButton();
    this.confirmDeletion();
  }

  /**
   * Clicks on the edit button in the first element of the project rules table.
   */
  public clickOnEditButtonInFirstElement(projectType: ProblemTypes): void {
    let endpoints: { method: string; path: string; alias: string }[] = [];

    switch (projectType) {
        case ProblemTypes.Regression:
            endpoints = [
                { method: 'GET', path: '**/api/datasets/*/get_nominal_attributes_with_values', alias: 'getNominalAttributes' },
                { method: 'POST', path: '**/api/datasets/*/condition_coverage', alias: 'postConditionCoverage' },
                { method: 'PUT', path: '**/calculate/*/rule_indicators', alias: 'putRuleIndicators' },
                { method: 'GET', path: '**/api/lists/*/rule_available_indicators', alias: 'getAvailableIndicators' }
            ];
            break;

        case ProblemTypes.Survival:
            endpoints = [
                { method: 'GET', path: '**/api/datasets/*/get_nominal_attributes_with_values', alias: 'getNominalAttributes' },
                { method: 'POST', path: '**/api/datasets/*/condition_coverage', alias: 'postConditionCoverage' },
                { method: 'PUT', path: '**/calculate/*/rule_indicators', alias: 'putRuleIndicators' },
                { method: 'GET', path: '**/api/lists/*/rule_available_indicators', alias: 'getAvailableIndicators' }
            ];
            break;

        case ProblemTypes.Classification:
        default:
            endpoints = [
                { method: 'GET', path: '**/api/datasets/*/get_nominal_attributes_with_values', alias: 'getNominalAttributes' },
                { method: 'GET', path: '**/api/datasets/*/class_distribution', alias: 'getClassDistribution' },
                { method: 'POST', path: '**/api/datasets/*/condition_coverage', alias: 'postConditionCoverage' },
                { method: 'PUT', path: '**/calculate/*/rule_indicators', alias: 'putRuleIndicators' },
                { method: 'GET', path: '**/api/lists/*/rule_available_indicators', alias: 'getAvailableIndicators' }
            ];
            break;
    }

    endpoints.forEach(({ method, path, alias }) => {
        cy.intercept(method, path).as(alias);
    });

    cy.get(this.selectors.firstRuleTableCell).should('be.visible').eq(1).children().first().click({ force: true });

    cy.get('rolap-project-rules-table-editor').should('be.visible');
    
    const aliasesToWaitFor = endpoints.map(e => `@${e.alias}`);
    cy.wait(aliasesToWaitFor, { timeout: 120000 });

    if (projectType === ProblemTypes.Regression) {
        cy.wait('@putRuleIndicators', { timeout: 30000 });
    } 
}

  // Click the first delete rule button
  private clickFirstDeleteRuleButton(): void {
    cy.get(this.selectors.deleteRuleButton).should('exist').first().click({ force: true });
  }

  // Confirm deletion by clicking the "Yes" button in the dx popup
  private confirmDeletion(): void {
    cy.wait(300);
    cy.get(this.selectors.confirmPopupYesButton).should('exist').first().click({ force: true });
  }

  /**
   * Toggle filter the dataset column for the given rule
   *
   * @param ruleIndex: rule index to select
   */
  public toggleFilterTheDatasetColumnForRule(ruleIndex: number): void {
    cy.get(this.selectors.ruleFilterToggle(ruleIndex)).find('dx-check-box').should('exist').click({ force: true });
  }

  public clickComparisonCheckbox(rowIndex: number): void {
    cy.get(this.selectors.comparisonCheckbox(rowIndex)).click({ force: true });
  }

  /**
   * Add new rule to Rule Big Table. Rule is added from existing ruleset.
   */
  public addNewRuleFromExistingRuleset() {
    cy.wait(500);
    cy.get(this.selectors.addRuleButton).should('exist').click({ force: true });
    cy.wait(500);
    cy.get(this.selectors.addRuleFromAnotherRulesetButton).should('exist').click({ force: true });
    cy.wait(500);
    cy.get(this.selectors.modalTreeItemDataSet).should('exist').wait(500).dblclick({ force: true }); 
    cy.wait(500);
    cy.get(this.selectors.modalTreeItemRuleSet).should('exist').wait(500).click({ force: true });

    cy.wait(2000);
    cy.get(this.selectors.rulesManualSelectTable)
      .find('tbody[role="presentation"]')
      .eq(1)
      .find('tr')
      .eq(0)
      .find('td')
      .eq(0)
      .find('.dx-checkbox')
      .click({ force: true });

    cy.wait(500);
    cy.get(this.selectors.rulesManualSelectTableAcceptButton).should('exist').click({ force: true });
    cy.wait(2000);
    cy.get(this.selectors.rulesManualRuleGeneratorAcceptButton).should('exist').click({ force: true });
    cy.wait(2000);
  }


  public checkNColumnTextsInTable(columnIndex: number, expectedTexts: string[]): void {
    cy.get(this.selectors.table).each(($el, index) => {
      cy.wrap($el)
        .find(this.selectors.tbody)
        .find('tr[aria-rowindex="1"]')
        .find('td')
        .eq(columnIndex)
        .should('contain.text', expectedTexts[index])
        .then((td) => {
          const actualText = td.text().trim().replace(/\s+/g, ' ');
          const expectedText = expectedTexts[index].trim().replace(/\s+/g, ' ');
          expect(actualText).to.eq(expectedText);
        });
    });
  }

  public extractedConditionsFromBigTable(count: number) {
    const conditions: string[] = [];
    cy.get(manualSelectRules.selectors.manualSelectRuleTable).should('exist');
    cy.get(manualSelectRules.selectors.manualSelectRuleTable)
      .find(this.selectors.table)
      .children()
      .find('tbody[role="presentation"]')
      .eq(1)
      .find('tr')
      .each(($el, index) => {
        if (index < count) {
          cy.wrap($el)
            .find('td')
            .eq(3)
            .invoke('text')
            .then((text) => {
              conditions.push(text);
            });
        }
      });
    return conditions;
  }

  public checkExpectedRulesInRulesTable(expectedLength: number, conditions: string[]) {
    cy.get(this.selectors.table)
      .children()
      .find('tbody[role="presentation"]')
      .eq(1)
      .find('tr')
      .should('have.length', expectedLength)
      .each(($el, index) => {
        if (index < expectedLength - 1) {
          cy.wrap($el)
            .find('td')
            .eq(4)
            .invoke('text')
            .then((text) => {
              expect(text).to.eq(conditions[index]);
            });
        }
      });
  }

  public filterColumn(columnName: string, filterValue: string) {
    // First, click on the column header to ensure the filter row is visible
    cy.get(`td[aria-label*="${columnName}"]`)
      .first()
      .click({ force: true });
    
    cy.get(`td[aria-label*="${columnName}"]`)
      .first()
      .invoke('attr', 'id')
      .then((columnId) => {
        // Wait for the filter input to appear and become interactable
        cy.get(`input[aria-label="Filter cell"][aria-describedby="${columnId}"]`)
          .should('exist')
          .scrollIntoView()
          .should('not.be.disabled')
          .wait(500) // Allow time for the input to be ready
          .click({ force: true }) // Force click to focus the input
          .clear()
          .type(filterValue, { force: true });
      });
  }
}

export const projectRulesTable = new ProjectRulesTable();
