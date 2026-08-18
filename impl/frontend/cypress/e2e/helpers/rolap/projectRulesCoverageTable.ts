//* Helper for <rrolap-project-rules-coverage-table />
// This utility provides methods to interact with the rules coverage table in the project.

export class ProjectRulesCoverageTable {
  private readonly ruleNameRegex = /\D+(\d+)/gm;
  private selectors = {
    filteringRulesChips: '[data-cy="filtering-rules-chips"]',
    ruleChips: '[data-cy="rule-chips"]',
  };

  /**
   * Get the indices of the displayed filtering rules
   *
   * @returns promise with indices of the displayed filtering rules
   */
  public getDisplayedFilteringRulesIndices(): Promise<number[]> {
    return new Promise((resolve) => {
      const rulesIndices: number[] = [];
      cy.get(this.selectors.filteringRulesChips)
        .each((chips) => {
          const ruleName: string = chips.text();
          const matches = ruleName.matchAll(this.ruleNameRegex);
          const ruleAutoIncrement = Array.from(matches, (m) => m[1])[0];
          const ruleIndex = Number.parseInt(ruleAutoIncrement) - 1;
          rulesIndices.push(ruleIndex);
        })
        .then(() => {
          return resolve(rulesIndices);
        });
    });
  }
}

export const projectRulesCoverageTable = new ProjectRulesCoverageTable();
