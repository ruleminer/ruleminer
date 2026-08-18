import { createDxTextBox } from '@e2e-helpers/devexpress/dxTextBox';

/*
 * Helper for <rolap-rename />
 * This utility provides methods to interact with the RenameComponent component.
 */
class RenameModal {
  private selectors = {
    input: '[data-cy="rename-modal-input"]',
    cancelButton: '[data-cy="rename-modal-cancel-button"]',
    confirmButton: '[data-cy="rename-modal-confirm-button"]',
  };

  private inputBox = createDxTextBox(this.selectors.input);

  /**
   * Types a new name into the rename input.
   *
   * @param newName - The new name to type into the input field.
   */
  public typeNewName(newName: string): void {
    this.inputBox.typeText(newName);
  }

  /**
   * Clicks the cancel button.
   */
  public clickCancelButton(): void {
    cy.get(this.selectors.cancelButton).click({ force: true });
  }

  /**
   * Clicks the confirm button.
   */
  public clickConfirmButton(): void {
    cy.get(this.selectors.confirmButton).click({ force: true });
  }

  /**
   * Ensures the rename modal is visible.
   */
  public ensureModalVisible(): void {
    this.inputBox.ensureVisible();
  }

  /**
   * Ensures the rename modal is not visible.
   */
  public ensureModalNotVisible(): void {
    this.inputBox.ensureNotVisible();
  }

  /**
   * Types a new name and clicks the confirm button.
   *
   * @param newName - The new name to type into the input field.
   */
  public renameAndConfirm(newName: string): void {
    this.typeNewName(newName);
    this.clickConfirmButton();
  }
}

export const renameModal = new RenameModal();
