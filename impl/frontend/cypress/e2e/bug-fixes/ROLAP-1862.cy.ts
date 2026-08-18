import 'cypress-if';
import { createDxTextBox } from '@e2e-helpers/devexpress/dxTextBox';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

describe('Test ROLAP-1862', () => {
  beforeEach(() => {
    cy.prepareTest();
    cy.createSampleProject(ProblemTypes.Classification);
  });

  it(`CSV file with semicolon delimiter without header should be imported.`, () => {
    cy.get('[data-cy="add-dataset-btn"]').click({ force: true });

    cy.get('input[type=file]').selectFile('./cypress/fixtures/ticdata.csv', { force: true });
    cy.wait(600);
    cy.get('[data-cy="go-to-format-step-btn"]').click({ force: true });
    createDxTextBox('[data-cy="dataset-separator-input"]').typeText(';');
    cy.get('[data-cy="has-header-checkbox"] input[name="hasHeader"]').click({ force: true });
    cy.wait(600);
    cy.get('[data-cy="go-to-columns-step-btn"]').should('not.have.attr', 'aria-disabled');
  });

  before(() => {
    cy.stub(console, 'error').as('consoleError');
  });
});
