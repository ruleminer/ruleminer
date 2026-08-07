class Labels {
  private selectors = {
    label: '[data-cy="label"]',
    rulesBigTable: '[data-cy="rules-big-table"]',
    addLabelToRule: '[data-cy="add-label-button-to-rule"]',
    addNewLabel: '[data-cy="add-new-label"]',
    labelNameInput: '[data-cy="label-name-input"]',
    saveNewLabel: '[data-cy="save-new-label"]',
    saveSelectedLabel: '[data-cy="save-selected-label"]',
    saveEditedLabel: '[data-cy="save-edited-label"]',
    removeEditedLabel: '[data-cy="remove-edited-label"]',
    labelSelectComponent: '[data-cy="rolap-label-select"]',
    labelPopupCloseButton: '.popup-close-btn',
  };

  public testLabelName = 'cy-test-label';

  public addLabel(labelName: string, rowNumber: number) {
    this.removeTestLabel(labelName);
    this.openLabelEditor(rowNumber);
    this.addLabelInEditor(labelName);
    this.addTestLabelToRule(labelName);
  }

  public openLabelEditor(rowNumber: number) {
    cy.get(this.selectors.rulesBigTable)
      .find('tbody[role="presentation"]')
      .eq(1)
      .find('tr')
      .eq(rowNumber)
      .find(this.selectors.addLabelToRule)
      .click({ force: true });
  }

  public closeLabelEditor() {
    cy.get(this.selectors.labelPopupCloseButton).should('exist').click({ force: true });
  }

  public addLabelInEditor(labelName: string) {
    // click 'add new label' button
    cy.get(this.selectors.addNewLabel).should('exist').click({ force: true });

    // set new label name
    cy.get(`${this.selectors.labelNameInput} .dx-texteditor-input`)
      .should('exist')
      .clear({ force: true })
      .type(labelName, { force: true });

    // click 'save' button
    cy.get(this.selectors.saveNewLabel).should('exist').click({ force: true });
  }

  public addTestLabelToRule(labelName: string) {
    // select label
    cy.get(this.selectors.labelSelectComponent)
      .find(this.selectors.label)
      .contains(labelName)
      .should('exist')
      .click({ force: true });
    // add selected label
    cy.get(this.selectors.saveSelectedLabel).should('exist').click({ force: true });
  }

  public removeLabel(labelName: string, rowNumber: number) {
    this.removeLabelFromRule(labelName);
    this.openLabelEditor(rowNumber);
    this.removeLabelFromDB(labelName);
  }

  /**
   * Remove test label if exists in label selector.
   */
  public removeTestLabel(labelName: string) {
    this.openLabelEditor(0);
    cy.wait(2000);
    cy.get(this.selectors.labelSelectComponent).then(($container) => {
      const labels = $container.find(this.selectors.label);
      if (labels.length > 0) {
        this.removeLabelFromDB(labelName);
        cy.wait(2000);
      } else {
        cy.wait(2000);
        this.closeLabelEditor();
      }
    });
  }

  public removeLabelFromRule(labelName: string) {
    // find test label and click on it
    cy.get(this.selectors.label).contains(labelName).should('exist').click({ force: true });

    // click remove button on label popup
    cy.get(this.selectors.removeEditedLabel).should('exist').click({ force: true });
  }

  public removeLabelFromDB(labelName: string) {
    // right click on test label
    cy.get(this.selectors.labelSelectComponent).find(this.selectors.label).contains(labelName).rightclick({ force: true });

    // click second element in opened context menu
    cy.get('.dx-overlay-content.dx-inner-overlay.dx-context-menu.dx-menu-base')
      .invoke('attr', 'id')
      .then(($contextMenuId) => {
        cy.get(`#${$contextMenuId}`).find('[role="menuitem"]').eq(1).click({ force: true });
      });
  }

  public checkIfTestLabelIsInRulesBigTableFirstRow() {
    cy.get(this.selectors.rulesBigTable)
      .find('tbody[role="presentation"]')
      .eq(1)
      .find('tr')
      .eq(0)
      .find(this.selectors.label)
      .should('exist');
  }

  public checkNumberOfLabelsInRow(expectedLength: number, rowNumber: number) {
    cy.get(this.selectors.rulesBigTable)
      .find('tbody[role="presentation"]')
      .eq(1)
      .find('tr')
      .eq(rowNumber)
      .find(this.selectors.label)
      .should('have.length', expectedLength);
  }
}

export const labels = new Labels();