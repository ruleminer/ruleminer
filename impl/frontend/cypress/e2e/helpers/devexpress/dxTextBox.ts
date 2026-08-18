/*
 * Helper for <dx-text-box />
 * This utility provides methods to interact with the DxTextBox component.
 *
 * Usage:
 * In template:
 * <dx-text-box data-cy="selector-name" .../>
 *
 * In e2e tests:
 * const inputBox = createDxTextBox('[data-cy="selector-name"]');
 */
class DxTextBox {
  private selector: string;

  constructor(selector: string) {
    this.selector = selector;
  }

  /**
   * Types text into the dx-text-box input.
   * Ensures the input is visible before typing.
   *
   * @param text - The text to type into the input field.
   */
  public typeText(text: string): void {
    this.ensureVisible();
    cy.get(`${this.selector} .dx-texteditor-input`).clear().type(text);
  }

  /**
   * Clears the dx-text-box input.
   * Ensures the input is visible before clearing.
   */
  public clearText(): void {
    this.ensureVisible();
    cy.get(`${this.selector} .dx-texteditor-input`).clear();
  }

  /**
   * Ensures the dx-text-box input is visible.
   */
  public ensureVisible(): void {
    cy.get(`${this.selector} .dx-texteditor-input`).should('be.visible');
  }

  /**
   * Ensures the dx-text-box input is not visible.
   */
  public ensureNotVisible(): void {
    cy.get(`${this.selector} .dx-texteditor-input`).should('not.exist');
  }
}

export const createDxTextBox = (selector: string) => new DxTextBox(selector);
