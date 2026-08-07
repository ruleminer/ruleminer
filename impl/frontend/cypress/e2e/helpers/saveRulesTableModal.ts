import { createDxTextBox } from "./devexpress/dxTextBox";

class SaveRulesetModal {
  private selectors = {
    modalContainer: 'rolap-project-save-rules-table-modal',
    ruleSetNameInput: '[data-cy="save-ruleset-modal-name-input"]',
    overwriteCheckbox: '[data-cy="save-ruleset-modal-overwrite-checkbox"]',
    saveButton: '[data-cy="save-ruleset-modal-save-button"]',
    cancelButton: '[data-cy="save-ruleset-modal-cancel-button"]',
    checkboxInput: 'input[name="overwrite"]',
    checkboxContainer: '.dx-checkbox-container',
  };

  private nameInputBox = createDxTextBox(this.selectors.ruleSetNameInput);

  public ensureModalVisible(): void {
    cy.get(this.selectors.modalContainer).should('be.visible');
    this.nameInputBox.ensureVisible();
    cy.get(this.selectors.overwriteCheckbox).should('be.visible');
    cy.get(this.selectors.saveButton).should('be.visible');
    cy.get(this.selectors.cancelButton).should('be.visible');
  }

  public ensureModalNotVisible(): void {
    cy.get(this.selectors.modalContainer).should('not.exist');
  }

  public toggleOverwriteCheckbox(): void {
    this.ensureModalVisible();
    cy.get(this.selectors.overwriteCheckbox).within(() => {
      cy.get(this.selectors.checkboxInput).then(() => {
        cy.get(this.selectors.checkboxContainer).click({ force: true });
      });
    });
    cy.wait(500);
  }



  public typeName(newName: string): void {
    this.ensureModalVisible();
    this.nameInputBox.typeText(newName);
  }

  public clickSaveButton(): void {
    this.ensureModalVisible();
    cy.get(this.selectors.saveButton).should('not.be.disabled').click({ force: true });
  }

  public clickCancelButton(): void {
    this.ensureModalVisible();
    cy.get(this.selectors.cancelButton).click({ force: true });
  }

  public saveAsNewRuleset(newName: string): void {
    this.ensureModalVisible();
    this.toggleOverwriteCheckbox();
    this.typeName(newName);
    this.clickSaveButton();
    this.ensureModalNotVisible();
  }

  public overwriteRuleset(): void {
    this.ensureModalVisible();
    this.clickSaveButton();
    this.ensureModalNotVisible();
  }
}

export const saveRulesetModal = new SaveRulesetModal();